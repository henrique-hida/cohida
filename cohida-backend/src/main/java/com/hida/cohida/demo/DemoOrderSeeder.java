package com.hida.cohida.demo;

import com.hida.cohida.account.repository.AccountRepository;
import com.hida.cohida.auth.dto.AddressRequest;
import com.hida.cohida.auth.dto.RegisterRequest;
import com.hida.cohida.auth.service.AuthService;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.enums.AddressType;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import com.hida.cohida.paymentcard.dto.PaymentCardCreateRequest;
import com.hida.cohida.paymentcard.service.PaymentCardService;
import com.hida.cohida.product.repository.ProductVariantRepository;
import com.hida.cohida.returnrequest.domain.ReturnStatus;
import com.hida.cohida.returnrequest.service.ReturnService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
class DemoOrderSeeder {
  private final AccountRepository accounts;
  private final AuthService auth;
  private final PaymentCardService cards;
  private final OrderRepository orders;
  private final ProductVariantRepository variants;
  private final ReturnService returns;

  DemoOrderSeeder(AccountRepository accounts, AuthService auth,
      PaymentCardService cards, OrderRepository orders,
      ProductVariantRepository variants, ReturnService returns) {
    this.accounts = accounts;
    this.auth = auth;
    this.cards = cards;
    this.orders = orders;
    this.variants = variants;
    this.returns = returns;
  }

  void seed() {
    Customer ana =
        customer(
            "Ana Costa", "ana.demo@cohida.test", "52998224725", "11990000001");
    Customer bruno =
        customer(
            "Bruno Lima",
            "bruno.demo@cohida.test",
            "11144477735",
            "11990000002");
    Customer clara =
        customer(
            "Clara Souza",
            "clara.demo@cohida.test",
            "93541134780",
            "11990000003");

    PaymentCard anaCard = card(ana, "4111111111111111");
    PaymentCard brunoCard = card(bruno, "5555555555554444");
    PaymentCard claraCard = card(clara, "378282246310005");

    LocalDateTime now = LocalDateTime.now();
    List<DemoOrder> samples =
        List.of(
            new DemoOrder(
                ana, anaCard, "DEMO-BAL-001", 2, OrderStatus.EM_PROCESSAMENTO),
            new DemoOrder(
                bruno, brunoCard, "DEMO-RUN-001", 1, OrderStatus.APROVADA),
            new DemoOrder(
                clara, claraCard, "DEMO-TRN-001", 3, OrderStatus.EM_TRANSITO),
            new DemoOrder(
                ana, anaCard, "DEMO-OUT-001", 1, OrderStatus.ENTREGUE),
            new DemoOrder(
                bruno, brunoCard, "DEMO-FTB-002", 1, OrderStatus.ENTREGUE),
            new DemoOrder(
                clara, claraCard, "DEMO-RUN-002", 1, OrderStatus.APROVADA),
            new DemoOrder(
                ana, anaCard, "DEMO-TRN-002", 2, OrderStatus.EM_TRANSITO),
            new DemoOrder(
                bruno,
                brunoCard,
                "DEMO-MAR-001",
                1,
                OrderStatus.EM_PROCESSAMENTO),
            new DemoOrder(
                clara, claraCard, "DEMO-OUT-003", 1, OrderStatus.ENTREGUE),
            new DemoOrder(
                ana, anaCard, "DEMO-MAR-002", 2, OrderStatus.APROVADA),
            new DemoOrder(
                bruno, brunoCard, "DEMO-OUT-004", 1, OrderStatus.EM_TRANSITO),
            new DemoOrder(
                clara,
                claraCard,
                "DEMO-FTB-003",
                1,
                OrderStatus.EM_PROCESSAMENTO));
    int existingOrders =
        List.of(ana, bruno, clara).stream()
            .mapToInt(
                customer ->
                    orders
                        .findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                        .size())
            .sum();
    SaleOrder delivered = null;
    for (int index = existingOrders; index < samples.size(); index++) {
      DemoOrder sample = samples.get(index);
      SaleOrder saved =
          order(
              sample.customer(),
              sample.card(),
              sample.sku(),
              sample.quantity(),
              sample.status(),
              now);
      if (existingOrders == 0
          && sample.status() == OrderStatus.ENTREGUE
          && delivered == null) delivered = saved;
    }

    redistributeDemoOrderDates(now, ana, bruno, clara);

    if (delivered != null) {
      var request =
          returns.request(
              ana.getId(),
              delivered.getId(),
              delivered.getItems().getFirst().getId(),
              "Produto para acompanhamento de troca.");
      returns.status(request.getId(), ReturnStatus.TROCA_AUTORIZADA);
    }
  }

  private void redistributeDemoOrderDates(
      LocalDateTime now, Customer... customers) {
    List<SaleOrder> demoOrders =
        java.util.Arrays.stream(customers)
            .flatMap(
                customer ->
                    orders
                        .findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                        .stream())
            .toList();
    LocalDateTime firstSale = now.minusMonths(5).withDayOfMonth(10);
    for (int index = 0; index < demoOrders.size(); index++) {
      orders.updateCreatedAt(
          demoOrders.get(index).getId(),
          firstSale.plusDays((index % 12) * 14L));
    }
  }

  private record DemoOrder(
      Customer customer,
      PaymentCard card,
      String sku,
      int quantity,
      OrderStatus status) {}

  private Customer customer(
      String name, String email, String cpf, String phone) {
    return accounts
        .findByEmailIgnoreCaseAndDeletedAtIsNull(email)
        .map(account -> account.getCustomer())
        .orElseGet(
            () ->
                auth.createCustomer(
                    new RegisterRequest(
                        name,
                        java.time.LocalDate.of(1992, 6, 15),
                        cpf,
                        phone,
                        email,
                        "Demo@123",
                        "Demo@123",
                        address("Cobrança"),
                        address("Entrega"))));
  }

  private static AddressRequest address(String label) {
    return new AddressRequest(
        label,
        "Rua do Esporte",
        "100",
        "Centro",
        "01001000",
        "São Paulo",
        "SP",
        "Brasil");
  }

  private PaymentCard card(Customer customer, String number) {
    return cards.findAll(customer.getId()).stream()
        .findFirst()
        .orElseGet(
            () ->
                cards.create(
                    customer.getId(),
                    new PaymentCardCreateRequest(
                        "demo-card-" + customer.getId(),
                        number,
                        "Cartão principal",
                        12,
                        2030)));
  }

  private SaleOrder order(
      Customer customer,
      PaymentCard card,
      String sku,
      int quantity,
      OrderStatus target,
      LocalDateTime createdAt) {
    var variant =
        variants.findAll().stream()
            .filter(candidate -> candidate.getSku().equals(sku))
            .findFirst()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "Produto demonstrativo não encontrado: " + sku));
    var address =
        customer.getAddresses().stream()
            .filter(candidate -> candidate.getType() == AddressType.DELIVERY)
            .findFirst()
            .orElseThrow();
    long subtotal = variant.getPriceCents() * quantity;
    SaleOrder order =
        new SaleOrder(
            customer,
            subtotal,
            0,
            0,
            null,
            card.getBrand(),
            card.getLastDigits(),
            address.getLabel(),
            address.getStreet(),
            address.getNumber(),
            address.getNeighborhood(),
            address.getZipCode(),
            address.getCity(),
            address.getState(),
            address.getCountry());
    order.addPayment(card, subtotal);
    order.addItem(
        new OrderItem(
            variant.getId(),
            variant.getProduct().getName(),
            variant.getSku(),
            variant.getLabel(),
            variant.getPriceCents(),
            quantity));
    if (target == OrderStatus.APROVADA
        || target == OrderStatus.EM_TRANSITO
        || target == OrderStatus.ENTREGUE) order.approve();
    if (target == OrderStatus.EM_TRANSITO || target == OrderStatus.ENTREGUE)
      order.dispatch("DEMO-" + sku);
    if (target == OrderStatus.ENTREGUE) order.confirmDelivery();
    SaleOrder saved = orders.save(order);
    orders.updateCreatedAt(saved.getId(), createdAt);
    return saved;
  }

}
