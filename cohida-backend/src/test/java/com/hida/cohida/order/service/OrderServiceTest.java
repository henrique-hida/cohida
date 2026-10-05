package com.hida.cohida.order.service;

import com.hida.cohida.account.domain.Account;
import com.hida.cohida.cart.service.CartService;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.service.CouponService;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.enums.AddressType;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.dto.PaymentAllocationRequest;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import com.hida.cohida.paymentcard.dto.PaymentCardCreateRequest;
import com.hida.cohida.paymentcard.service.PaymentCardService;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import com.hida.cohida.product.repository.ProductVariantRepository;
import com.hida.cohida.product.service.ProductService;
import com.hida.cohida.returnrequest.domain.ReturnStatus;
import com.hida.cohida.returnrequest.service.ReturnService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class OrderServiceTest {
    @Autowired
    private CustomerRepository customers;
    @Autowired
    private ProductService products;
    @Autowired
    private ProductVariantRepository variants;
    @Autowired
    private CouponService coupons;
    @Autowired
    private PaymentCardService cards;
    @Autowired
    private CartService carts;
    @Autowired
    private OrderService orders;
    @Autowired
    private ReturnService returns;

    @Test
    void checksOutCartUsingServerPriceCouponAndStock() {
        Customer customer = customer();
        customers.save(customer);
        Product product = products.create(new ProductUpsertRequest("Tênis de teste", "Cohida", "Tênis esportivo", null, List.of("Corrida"), 1, true,
                List.of(new ProductVariantRequest("TENIS-TESTE-40", "40", "Preto", "40", 20_000L, 5))));
        Long variantId = product.getVariants().getFirst().getId();
        Coupon coupon = coupons.create(new CouponUpsertRequest("DESC10", "10%", CouponDiscountType.PERCENTAGE, null, new BigDecimal("10"), 3_000L, 10_000L,
                LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusDays(1), 1, true));
        PaymentCard card = cards.create(customer.getId(), new PaymentCardCreateRequest("token-order-test", "4242 4242 4242 4242", "Pessoal", 12, 2030));

        carts.add(customer.getId(), variantId, 2);
        assertEquals(3_000L, carts.applyCoupon(customer.getId(), "DESC10").discountCents());

        Long addressId = customer.getAddresses().stream().filter(address -> address.getType() == AddressType.DELIVERY).findFirst().orElseThrow().getId();
        SaleOrder order = orders.checkout(customer.getId(), addressId, card.getId());

        assertEquals(OrderStatus.EM_PROCESSAMENTO, order.getStatus());
        assertEquals(40_000L, order.getSubtotalCents());
        assertEquals(3_000L, order.getDiscountCents());
        assertEquals(37_000L, order.getTotalCents());
        assertEquals(3, variants.findById(variantId).orElseThrow().getStockQuantity());
        assertEquals(1, coupons.findById(coupon.getId()).getRedeemedCount());
        assertTrue(carts.view(customer.getId()).items().isEmpty());

        orders.changeStatus(order.getId(), OrderStatus.PAGAMENTO_REALIZADO);
        orders.dispatch(order.getId(), "BR123");
        orders.changeStatus(order.getId(), OrderStatus.ENTREGUE);

        var returnRequest = returns.request(customer.getId(), order.getId(), order.getItems().getFirst().getId(), "Tamanho inadequado");
        returns.status(returnRequest.getId(), ReturnStatus.ACEITA);
        returns.dispatch(customer.getId(), returnRequest.getId(), "DEV123");
        returns.status(returnRequest.getId(), ReturnStatus.ITEM_RECEBIDO);
        var processed = returns.status(returnRequest.getId(), ReturnStatus.PROCESSADA);
        assertEquals(ReturnStatus.PROCESSADA, processed.getStatus());
        assertEquals(5, variants.findById(variantId).orElseThrow().getStockQuantity());
        assertTrue(processed.getIssuedCoupon().isReturnCredit());
        assertEquals(40_000L, processed.getIssuedCoupon().getRemainingCreditCents());
    }

    @Test
    void validatesAndRecordsSplitCardPayments() {
        Customer customer = customer();
        customers.save(customer);
        Product product = products.create(new ProductUpsertRequest("Produto dividido", "Cohida", "Teste", null, List.of("Corrida"), 1, true,
                List.of(new ProductVariantRequest("DIVIDIDO-1", "Único", "Preto", "Único", 20_000L, 4))));
        Coupon coupon = coupons.create(new CouponUpsertRequest("DIVIDE5", "Desconto de teste", CouponDiscountType.FIXED_AMOUNT, 5_000L, null, null, null,
                LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusDays(1), 5, true));
        PaymentCard first = cards.create(customer.getId(), new PaymentCardCreateRequest("token-split-first", "4242 4242 4242 4242", "Pessoal", 12, 2030));
        PaymentCard second = cards.create(customer.getId(), new PaymentCardCreateRequest("token-split-second", "5555 5555 5555 4444", "Trabalho", 12, 2030));
        Long addressId = customer.getAddresses().stream().filter(address -> address.getType() == AddressType.DELIVERY).findFirst().orElseThrow().getId();

        carts.add(customer.getId(), product.getVariants().getFirst().getId(), 1);
        carts.applyCoupon(customer.getId(), coupon.getCode());
        SaleOrder order = orders.checkout(customer.getId(), addressId, List.of(
                new PaymentAllocationRequest(first.getId(), 7_000L),
                new PaymentAllocationRequest(second.getId(), 8_000L)));

        assertEquals(OrderStatus.EM_PROCESSAMENTO, order.getStatus());
        assertEquals(15_000L, order.getTotalCents());
        assertEquals(2, order.getPayments().size());
        List<Long> allocations = order.getPayments().stream()
                .sorted(java.util.Comparator.comparingInt(com.hida.cohida.order.domain.OrderPayment::getPaymentPosition))
                .map(payment -> payment.getAmountCents())
                .toList();
        assertEquals(List.of(7_000L, 8_000L), allocations);
    }

    @Test
    void issuesCustomerExchangeCreditForCouponValueAbovePurchase() {
        Customer customer = customer();
        customers.save(customer);
        Product product = products.create(new ProductUpsertRequest("Produto cupom excedente", "Cohida", "Teste", null, List.of("Corrida"), 1, true,
                List.of(new ProductVariantRequest("CUPOM-EXCEDENTE-1", "Único", "Preto", "Único", 20_000L, 4))));
        coupons.create(new CouponUpsertRequest("EXCEDE27", "Cupom de teste", CouponDiscountType.FIXED_AMOUNT, 27_000L, null, null, null,
                LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusDays(1), 5, true));
        PaymentCard card = cards.create(customer.getId(), new PaymentCardCreateRequest("token-surplus", "4242 4242 4242 4242", "Pessoal", 12, 2030));
        Long addressId = customer.getAddresses().stream().filter(address -> address.getType() == AddressType.DELIVERY).findFirst().orElseThrow().getId();

        carts.add(customer.getId(), product.getVariants().getFirst().getId(), 1);
        carts.applyCoupon(customer.getId(), "EXCEDE27");
        SaleOrder order = orders.checkout(customer.getId(), addressId,
                List.of(new PaymentAllocationRequest(card.getId(), 0L)));

        assertEquals(0L, order.getTotalCents());
        assertTrue(order.getIssuedCoupon().isReturnCredit());
        assertEquals(7_000L, order.getIssuedCoupon().getRemainingCreditCents());
        assertEquals(customer.getId(), order.getIssuedCoupon().getAssignedCustomer().getId());
    }

    private static Customer customer() {
        Customer customer = new Customer("CU-ORDER-TEST", "Cliente Pedido", LocalDate.of(1990, 1, 1), "52998224725", "11999999999");
        customer.attachAccount(new Account("order-test@example.com", "not-used"));
        customer.addAddress(address(AddressType.BILLING));
        customer.addAddress(address(AddressType.DELIVERY));
        return customer;
    }

    private static CustomerAddress address(AddressType type) {
        return new CustomerAddress("Principal", type, "Rua A", "1", "Centro", "01001000", "São Paulo", "SP", "Brasil");
    }
}
