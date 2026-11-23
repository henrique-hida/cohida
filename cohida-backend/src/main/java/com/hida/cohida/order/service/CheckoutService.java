package com.hida.cohida.order.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.cart.domain.Cart;
import com.hida.cohida.cart.domain.CartItem;
import com.hida.cohida.cart.service.CartService;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.domain.CheckoutIdempotency;
import com.hida.cohida.order.dto.OrderResponse;
import com.hida.cohida.order.dto.PaymentAllocationRequest;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.order.repository.CheckoutIdempotencyRepository;
import com.hida.cohida.payment.PaymentProcessor;
import com.hida.cohida.shipping.ShippingCalculator;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import com.hida.cohida.paymentcard.exception.PaymentCardNotFoundException;
import com.hida.cohida.paymentcard.repository.PaymentCardRepository;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.HexFormat;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import tools.jackson.databind.json.JsonMapper;

@Service
public class CheckoutService {
  private final OrderRepository orders;
  private final CartService carts;
  private final CustomerRepository customers;
  private final PaymentCardRepository cards;
  private final ProductVariantRepository variants;
  private final CouponRepository coupons;
  private final NotificationService notifications;
  private final PaymentProcessor paymentProcessor;
  private final ShippingCalculator shippingCalculator;
  private final TransactionTemplate transactions;
  private final OrderPaymentService payments;
  private final CheckoutIdempotencyRepository idempotency;
  private final JsonMapper json;

  public CheckoutService(
      OrderRepository orders,
      CartService carts,
      CustomerRepository customers,
      PaymentCardRepository cards,
      ProductVariantRepository variants,
      CouponRepository coupons,
      NotificationService notifications,
      PaymentProcessor paymentProcessor,
      ShippingCalculator shippingCalculator,
      TransactionTemplate transactions,
      OrderPaymentService payments,
      CheckoutIdempotencyRepository idempotency,
      JsonMapper json) {
    this.orders = orders;
    this.carts = carts;
    this.customers = customers;
    this.cards = cards;
    this.variants = variants;
    this.coupons = coupons;
    this.notifications = notifications;
    this.paymentProcessor = paymentProcessor;
    this.shippingCalculator = shippingCalculator;
    this.transactions = transactions;
    this.payments = payments;
    this.idempotency = idempotency;
    this.json = json;
  }

  private record CheckoutPayload(
      Long deliveryAddressId, List<PaymentAllocationRequest> payments,
      String cartSignature) {}

  public OrderResponse checkoutIdempotent(
      Long customerId, String key, Long addressId,
      List<PaymentAllocationRequest> requestedPayments, String cartSignature) {
    if (key == null || !key.matches(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
            + "[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
      throw new InvalidRequestException("Informe uma chave de compra válida.");
    }
    if (cartSignature == null || cartSignature.isBlank()
        || cartSignature.length() > 10000)
      throw new InvalidRequestException("Revise os itens do carrinho.");
    String normalizedKey = UUID.fromString(key).toString();
    String hash = requestHash(addressId, requestedPayments, cartSignature);
    OrderResponse result = transactions.execute(status -> {
      Customer customer = customers.findForCartUpdate(customerId)
          .orElseThrow(
              () -> new InvalidRequestException("Cliente não encontrado."));
      var existing =
          idempotency.findByCustomerIdAndKey(customerId, normalizedKey);
      if (existing.isPresent()) {
        if (!existing.get().getRequestHash().equals(hash))
          throw new ConflictException(
              "Esta chave já foi usada com outros dados.");
        return json.readValue(
            existing.get().getResponseJson(), OrderResponse.class);
      }
      SaleOrder order =
          checkoutTransaction(
              customerId, addressId, requestedPayments, cartSignature);
      if (order == null) return null;
      OrderResponse response = OrderResponse.from(order);
      idempotency.save(
          new CheckoutIdempotency(
              customer, normalizedKey, hash, order,
              json.writeValueAsString(response)));
      return response;
    });
    if (result == null)
      throw new InvalidRequestException(
          "O estoque foi alterado; o carrinho foi "
              + "atualizado. Revise os itens antes de finalizar.");
    return result;
  }

  private String requestHash(
      Long addressId, List<PaymentAllocationRequest> requestedPayments,
      String cartSignature) {
    try {
      String payload = json.writeValueAsString(
          new CheckoutPayload(addressId, requestedPayments, cartSignature));
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(payload.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 indisponível", exception);
    }
  }

  public SaleOrder checkout(Long customerId, Long addressId, Long cardId) {
    if (cardId == null)
      throw new InvalidRequestException("Selecione ao menos um cartão.");
    return checkout(
        customerId,
        addressId,
        List.of(new PaymentAllocationRequest(cardId, null)));
  }

  public SaleOrder checkout(
      Long customerId,
      Long addressId,
      List<PaymentAllocationRequest> requestedPayments) {
    SaleOrder result =
        transactions.execute(
            status ->
                checkoutTransaction(
                    customerId, addressId, requestedPayments, null));
    if (result == null)
      throw new InvalidRequestException(
          "O estoque foi alterado; o carrinho foi "
              + "atualizado. Revise os itens antes de finalizar.");
    return result;
  }

  private SaleOrder checkoutTransaction(
      Long customerId,
      Long addressId,
      List<PaymentAllocationRequest> requestedPayments,
      String expectedCartSignature) {
    if (addressId == null)
      throw new InvalidRequestException("Selecione o endereço de entrega.");
    Cart cart = carts.cart(customerId);
    if (carts.reconcileStockAtCheckout(cart)) return null;
    if (cart.getItems().isEmpty())
      throw new InvalidRequestException("O carrinho está vazio.");
    if (expectedCartSignature != null
        && !expectedCartSignature.equals(cartSignature(cart)))
      throw new InvalidRequestException(
          "O carrinho foi alterado. Revise os itens antes de finalizar.");
    Customer customer =
        customers
            .findWithDetailsById(customerId)
            .orElseThrow(
                () -> new InvalidRequestException("Cliente não encontrado."));
    CustomerAddress address = customer.address(addressId);
    List<Coupon> appliedCoupons =
        cart.getCoupons().stream()
            .sorted(java.util.Comparator.comparing(Coupon::getId))
            .map(
                coupon ->
                    coupons
                        .findWithLockById(coupon.getId())
                        .orElseThrow(
                            () ->
                                new InvalidRequestException("Cupom inválido.")))
            .toList();
    long subtotal = 0;
    for (CartItem item : cart.getItems()) {
      ProductVariant variant =
          variants
              .findWithLockById(item.getVariant().getId())
              .orElseThrow(
                  () ->
                      new InvalidRequestException("Variação não encontrada."));
      if (!variant.getProduct().isActive()
          || item.getQuantity() > variant.getStockQuantity())
        throw new InvalidRequestException(
            "Estoque insuficiente para " + variant.getSku() + ".");
      subtotal += variant.getPriceCents() * item.getQuantity();
    }
    long couponValue = carts.couponValue(cart);
    long discount = carts.discount(cart);
    long shipping = shippingCalculator.calculate(cart.getItems(), address);
    long total = Math.max(0, subtotal + shipping - discount);
    List<PaymentAllocationRequest> allocations =
        validateAllocations(requestedPayments, total, couponValue > 0);
    List<PaymentCard> selectedCards = new ArrayList<>();
    for (PaymentAllocationRequest allocation : allocations) {
      selectedCards.add(
          cards
              .findByIdAndCustomerIdAndDeletedAtIsNull(
                  allocation.paymentCardId(), customerId)
              .orElseThrow(
                  () ->
                      new PaymentCardNotFoundException(
                          allocation.paymentCardId())));
    }
    PaymentCard primaryCard =
        selectedCards.isEmpty() ? null : selectedCards.getFirst();
    SaleOrder order =
        new SaleOrder(
            customer,
            subtotal,
            discount,
            shipping,
            appliedCoupons.stream()
                .map(Coupon::getCode)
                .collect(java.util.stream.Collectors.joining(",")),
            primaryCard == null ? "CUPOM" : primaryCard.getBrand(),
            primaryCard == null ? "0000" : primaryCard.getLastDigits(),
            address.getLabel(),
            address.getStreet(),
            address.getNumber(),
            address.getNeighborhood(),
            address.getZipCode(),
            address.getCity(),
            address.getState(),
            address.getCountry());
    order.setCouponValueCents(couponValue);
    for (int index = 0; index < allocations.size(); index++) {
      order.addPayment(
          selectedCards.get(index), allocations.get(index).amountCents());
    }
    for (CartItem item : cart.getItems()) {
      ProductVariant variant =
          variants.findWithLockById(item.getVariant().getId()).orElseThrow();
      order.addItem(
          new OrderItem(
              variant.getId(),
              variant.getProduct().getName(),
              variant.getSku(),
              variant.getLabel(),
              variant.getPriceCents(),
              item.getQuantity()));
    }
    SaleOrder saved = orders.save(order);
    cart.clear();
    notifications.notify(
        customer,
        "ORDER_CREATED",
        "Seu pedido foi criado.",
        "/pedidos/" + saved.getId());
    var authorization = paymentProcessor.authorize(selectedCards, total);
    SaleOrder completed = payments.processPayment(
        saved.getId(), authorization.approved(), authorization.reason());
    Hibernate.initialize(completed.getCustomer());
    Hibernate.initialize(completed.getItems());
    Hibernate.initialize(completed.getPayments());
    completed.getPayments().forEach(
        payment -> Hibernate.initialize(payment.getPaymentCard()));
    Hibernate.initialize(completed.getIssuedCoupon());
    return completed;
  }

  private String cartSignature(Cart cart) {
    String items = cart.getItems().stream()
        .map(item -> item.getVariant().getId() + ":" + item.getQuantity()
            + ":" + item.getVariant().getPriceCents())
        .sorted()
        .collect(java.util.stream.Collectors.joining(","));
    String couponCodes = cart.getCoupons().stream()
        .map(Coupon::getCode)
        .sorted()
        .collect(java.util.stream.Collectors.joining(","));
    return items + "|" + couponCodes;
  }

  private static List<PaymentAllocationRequest> validateAllocations(
      List<PaymentAllocationRequest> requestedPayments,
      long totalCents,
      boolean couponsApplied) {
    if (totalCents > 0 && totalCents < 1_000 && !couponsApplied)
      throw new InvalidRequestException(
          "O valor cobrado no cartão deve ser de no mínimo R$ 10,00.");
    if ((requestedPayments == null || requestedPayments.isEmpty())
        && totalCents == 0) return List.of();
    if (requestedPayments == null || requestedPayments.isEmpty())
      throw new InvalidRequestException(
          "Informe ao menos um cartão de crédito.");

    List<PaymentAllocationRequest> normalizedPayments = requestedPayments;
    if (requestedPayments.size() == 1
        && requestedPayments.getFirst() != null
        && requestedPayments.getFirst().amountCents() == null) {
      normalizedPayments =
          List.of(
              new PaymentAllocationRequest(
                  requestedPayments.getFirst().paymentCardId(), totalCents));
    }
    Set<Long> cardIds = new HashSet<>();
    long allocatedCents = 0;
    for (PaymentAllocationRequest payment : normalizedPayments) {
      if (payment == null
          || payment.paymentCardId() == null
          || payment.amountCents() == null
          || payment.amountCents() < 0
          || !cardIds.add(payment.paymentCardId()))
        throw new InvalidRequestException(
            "Informe cartões e valores válidos para o pagamento.");
      if (totalCents > 0 && payment.amountCents() < 1_000 && !couponsApplied)
        throw new InvalidRequestException(
            "O valor pago em cada cartão deve ser de no mínimo R$ 10,00.");
      allocatedCents += payment.amountCents();
    }
    if (allocatedCents != totalCents)
      throw new InvalidRequestException(
          "Os valores dos cartões devem totalizar o valor do pedido.");
    if (totalCents == 0 && normalizedPayments.size() > 1)
      throw new InvalidRequestException(
          "Um pedido sem valor a pagar aceita somente um cartão.");
    return normalizedPayments;
  }

}
