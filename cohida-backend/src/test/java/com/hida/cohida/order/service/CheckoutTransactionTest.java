package com.hida.cohida.order.service;

import com.hida.cohida.account.domain.Account;
import com.hida.cohida.account.enums.AccountRole;
import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.analytics.service.AnalyticsService;
import com.hida.cohida.customer.service.CustomerService;
import com.hida.cohida.auth.exception.InvalidCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.hida.cohida.auth.session.RefreshSessionService;
import com.hida.cohida.auth.dto.AuthenticationResponse;
import com.hida.cohida.account.enums.AccountRole;
import com.hida.cohida.category.service.CategoryService;
import com.hida.cohida.cart.service.CartService;
import com.hida.cohida.cart.service.CartReservationService;
import com.hida.cohida.chat.ChatService;
import com.hida.cohida.cart.repository.CartRepository;
import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.repository.CategoryRepository;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.enums.AddressType;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.service.CouponService;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.notification.repository.NotificationRepository;
import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.order.dto.OrderResponse;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.payment.PaymentAuthorization;
import com.hida.cohida.payment.PaymentProcessor;
import com.hida.cohida.payment.PaymentOutboxRepository;
import com.hida.cohida.payment.PaymentEventHandler;
import com.hida.cohida.payment.PaymentQueue;
import com.hida.cohida.paymentcard.dto.PaymentCardCreateRequest;
import com.hida.cohida.paymentcard.service.PaymentCardService;
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import com.hida.cohida.product.repository.ProductVariantRepository;
import com.hida.cohida.product.service.ProductService;
import com.hida.cohida.returnrequest.domain.ReturnStatus;
import com.hida.cohida.returnrequest.repository.ReturnRequestRepository;
import com.hida.cohida.returnrequest.service.ReturnService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication
    .UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {
  "spring.datasource.url=jdbc:h2:mem:checkout_tx",
  "spring.task.scheduling.enabled=false",
  "cohida.openrouter.api-key=integration-test",
  "security.jwt.access-token-ttl=1h",
  "security.jwt.issuer=cohida-api"
})
class CheckoutTransactionTest {
  @DynamicPropertySource
  static void configureDatabase(DynamicPropertyRegistry properties) {
    String url = System.getenv("CHECKOUT_TEST_JDBC_URL");
    if (url == null) return;
    if (!url.matches(
        "jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/"
            + "cohida_checkout_test")) {
      throw new IllegalStateException(
          "Use um banco local isolado chamado cohida_checkout_test.");
    }
    properties.add("spring.datasource.url",
        () -> url + "?currentSchema=cohida");
    properties.add("spring.datasource.username",
        () -> System.getenv("CHECKOUT_TEST_DB_USER"));
    properties.add("spring.datasource.password",
        () -> System.getenv("CHECKOUT_TEST_DB_PASSWORD"));
    String cachePort = System.getenv("CACHE_TEST_REDIS_PORT");
    if (cachePort != null) {
      if (!cachePort.equals("56380"))
        throw new IllegalStateException("Use o cache isolado na porta 56380.");
      properties.add("cohida.cache.enabled", () -> "true");
      properties.add("cohida.cache.host", () -> "127.0.0.1");
      properties.add("cohida.cache.port", () -> cachePort);
      properties.add("cohida.cache.namespace", () -> "cohida:test:transaction");
    }
    String minioPort = System.getenv("MINIO_TEST_PORT");
    if (minioPort != null) {
      if (!minioPort.equals("59000"))
        throw new IllegalStateException("Use o MinIO isolado na porta 59000.");
      properties.add("cohida.storage.enabled", () -> "true");
      properties.add("cohida.storage.endpoint", () -> "http://127.0.0.1:59000");
      properties.add("cohida.storage.bucket", () -> "cohida-images-test");
      properties.add("cohida.storage.region", () -> "us-east-1");
      properties.add("cohida.storage.access-key", () -> "cohida_test");
      properties.add("cohida.storage.secret-key", () -> "cohida_test_password");
      properties.add("cohida.storage.path-style", () -> "true");
    }
    String redisPort = System.getenv("CHECKOUT_TEST_REDIS_PORT");
    if (redisPort != null) {
      if (!List.of("56379", "56381").contains(redisPort))
        throw new IllegalStateException("Use um Redis de teste isolado.");
      properties.add("spring.data.redis.host", () -> "127.0.0.1");
      properties.add("spring.data.redis.port", () -> redisPort);
    }
  }

  @Autowired private CustomerRepository customers;
  @Autowired private CategoryRepository categories;
  @Autowired private ProductService products;
  @Autowired private ProductVariantRepository variants;
  @Autowired private PaymentCardService cards;
  @Autowired private CouponService coupons;
  @Autowired private CartService carts;
  @Autowired private CartReservationService reservations;
  @Autowired private CartRepository cartRepository;
  @Autowired private OrderService orders;
  @Autowired private CheckoutService checkout;
  @Autowired private OrderRepository orderRepository;
  @Autowired private NotificationRepository notifications;
  @Autowired private TransactionTemplate transactions;
  @Autowired private StringRedisTemplate redis;
  @Autowired private PaymentEventHandler eventHandler;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private AnalyticsService analytics;
  @Autowired private RefreshSessionService sessions;
  @Autowired private com.hida.cohida.auth.session.RefreshSessionCleanup cleanup;
  @Autowired private CustomerService customerService;
  @Autowired private PasswordEncoder encoder;
  @Autowired private com.hida.cohida.auth.service.JwtService jwtService;
  @Autowired private CategoryService categoryService;
  @Autowired private com.hida.cohida.cache.PublicCategoryCache categoryCache;
  @Autowired private com.hida.cohida.demo.DemoSeederService demoSeeder;
  @Autowired private jakarta.persistence.EntityManager entityManager;
  @Autowired private ChatService chat;
  @Autowired private ReturnService returnService;
  @Autowired private ReturnRequestRepository returnRepository;
  @MockitoBean private PaymentProcessor processor;
  @MockitoBean private com.hida.cohida.image.ImageTransformer imageTransformer;
  @Autowired private com.hida.cohida.image.ImageJobRepository imageJobs;
  @Autowired private org.springframework.beans.factory.ObjectProvider<
      com.hida.cohida.image.ImageJobService> imageService;
  @Autowired private org.springframework.beans.factory.ObjectProvider<
      com.hida.cohida.image.ImageEventHandler> imageHandler;
  @Autowired private org.springframework.beans.factory.ObjectProvider<
      com.hida.cohida.storage.S3ObjectStorage> imageStorage;
  @MockitoBean private org.springframework.ai.chat.model.ChatModel chatModel;
  @MockitoSpyBean private CouponRepository couponRepository;
  @MockitoSpyBean private PaymentOutboxRepository paymentOutbox;
  @MockitoSpyBean private NotificationService notificationService;

  private Long customerId;
  private Long addressId;
  private Long variantId;
  private Long cardId;
  private Long categoryId;
  private String cartSignature;

  @BeforeEach
  void prepare() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    transactions.executeWithoutResult(status -> {
      var customer = new Customer(
          "C-" + suffix, "Cliente", LocalDate.of(1990, 1, 1),
          String.format("%011d", Integer.toUnsignedLong(suffix.hashCode())),
          "11999999999");
      customer.attachAccount(new Account(suffix + "@example.test", "unused"));
      customer.addAddress(new CustomerAddress(
          "Entrega", AddressType.DELIVERY, "Rua A", "1", "Centro",
          "01001000", "São Paulo", "SP", "Brasil"));
      customers.save(customer);
      customerId = customer.getId();
      addressId = customer.getAddresses().getFirst().getId();
      var category = categories.save(new Category(suffix, "Teste", "Teste"));
      categoryId = category.getId();
      var product = products.create(new ProductUpsertRequest(
          "Produto", "Marca", "Teste", null, List.of(category.getId()),
          1, true, List.of(new ProductVariantRequest(
              suffix, "Único", "Preto", "Único", 20_000L, 2))));
      variantId = product.getVariants().getFirst().getId();
      cardId = cards.create(customerId, new PaymentCardCreateRequest(
          suffix, "4242 4242 4242 4242", "Pessoal", 12, 2030)).getId();
      carts.add(customerId, variantId, 1);
      cartSignature = variantId + ":1:20000|";
    });
  }

  @Test
  void paymentFailureRollsBackOrderCartStockAndNotification() {
    when(processor.authorize(anyList(), anyLong()))
        .thenThrow(new IllegalStateException("Falha simulada"));
    assertThrows(IllegalStateException.class,
        () -> orders.checkout(customerId, addressId, cardId));
    assertTrue(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
    assertEquals(1, carts.view(customerId).items().size());
    assertEquals(
        2, variants.findById(variantId).orElseThrow().getStockQuantity());
    assertTrue(notifications.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
  }

  @Test
  void failureAfterStockUpdateRollsBackAllCheckoutWrites() {
    String code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    var coupon = coupons.create(new CouponUpsertRequest(
        code, "Cupom", CouponDiscountType.FIXED_AMOUNT,
        1_000L, null, null, null, LocalDateTime.now().minusMinutes(1),
        LocalDateTime.now().plusDays(1), 1, true));
    carts.applyCoupon(customerId, code);
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    doThrow(new IllegalStateException("Falha simulada no cupom"))
        .when(couponRepository).findByCode(code);

    assertThrows(IllegalStateException.class,
        () -> orders.checkout(customerId, addressId, cardId));
    assertTrue(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
    assertEquals(1, carts.view(customerId).items().size());
    assertEquals(
        2, variants.findById(variantId).orElseThrow().getStockQuantity());
    assertEquals(0, coupons.findById(coupon.getId()).getRedeemedCount());
    assertTrue(notifications.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
  }

  @Test
  void responseCanBeMappedAfterCheckoutTransactionEnds() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    var order = orders.checkout(customerId, addressId, cardId);
    var response = OrderResponse.from(order);
    assertEquals(1, response.items().size());
    assertEquals(1, response.payments().size());
    assertEquals(customerId, response.customerId());
  }

  @Test
  void repeatedIdempotencyKeyReturnsTheOriginalResponse() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    String key = UUID.randomUUID().toString();
    var payments = List.of(
        new com.hida.cohida.order.dto.PaymentAllocationRequest(cardId, null));
    var first =
        checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature);
    var second =
        checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature);
    assertEquals(first, second);
    assertEquals("PAYMENT_APPROVED", paymentOutbox.findByOrderId(first.id())
        .orElseThrow().getEventType());
    assertEquals(1, orderRepository
        .findByCustomerIdOrderByCreatedAtDesc(customerId).size());
    verify(processor, times(1)).authorize(anyList(), anyLong());
    assertThrows(com.hida.cohida.auth.exception.ConflictException.class,
        () ->
            checkout.checkoutIdempotent(
                customerId, key, addressId + 1, payments, cartSignature));
    assertThrows(com.hida.cohida.auth.exception.ConflictException.class,
        () ->
            checkout.checkoutIdempotent(
                customerId, key, addressId, payments,
                cartSignature + "changed"));
  }

  @Test
  void declinedPaymentRecordsOneDeclinedEventWithoutConsumingStock() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.declined("Recusado"));
    String key = UUID.randomUUID().toString();
    var payment = List.of(
        new com.hida.cohida.order.dto.PaymentAllocationRequest(cardId, null));
    var result = checkout.checkoutIdempotent(
        customerId, key, addressId, payment, cartSignature);
    var replay = checkout.checkoutIdempotent(
        customerId, key, addressId, payment, cartSignature);
    assertEquals(OrderStatus.REPROVADA, result.status());
    assertEquals(result, replay);
    assertEquals("PAYMENT_DECLINED", paymentOutbox.findByOrderId(result.id())
        .orElseThrow().getEventType());
    assertEquals(2, variants.findById(variantId).orElseThrow()
        .getStockQuantity());
    verify(processor, times(1)).authorize(anyList(), anyLong());
  }

  @Test
  void outboxFailureRollsBackThePurchase() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    doThrow(new IllegalStateException("Outbox indisponível"))
        .when(paymentOutbox).save(any());
    assertThrows(IllegalStateException.class,
        () -> orders.checkout(customerId, addressId, cardId));
    assertTrue(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
    assertEquals(1, carts.view(customerId).items().size());
    assertEquals(2, variants.findById(variantId).orElseThrow()
        .getStockQuantity());
    assertTrue(notifications.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_REDIS_PORT",
      matches = "56379")
  void queuePublishesAndProcessesDuplicateEventOnlyOnce() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    var order = orders.checkout(customerId, addressId, cardId);
    var event = paymentOutbox.findByOrderId(order.getId()).orElseThrow();
    var queue = new PaymentQueue(redis, paymentOutbox, eventHandler,
        transactions);
    pollUntilComplete(queue, event.getEventId());
    assertTrue(paymentOutbox.findById(event.getEventId()).orElseThrow()
        .isComplete());
    assertEquals(1, notifications
        .findByCustomerIdOrderByCreatedAtDesc(customerId)
        .stream().filter(n -> n.getType().equals("PAYMENT_APPROVED")).count());
    redis.opsForStream().add("cohida:payment-events:v1",
        java.util.Map.of("eventId", event.getEventId()));
    queue.poll();
    assertEquals(1, notifications
        .findByCustomerIdOrderByCreatedAtDesc(customerId)
        .stream().filter(n -> n.getType().equals("PAYMENT_APPROVED")).count());

    carts.add(customerId, variantId, 1);
    var second = orders.checkout(customerId, addressId, cardId);
    var secondEvent = paymentOutbox.findByOrderId(second.getId()).orElseThrow();
    var recordId = redis.opsForStream().add("cohida:payment-events:v1",
        java.util.Map.of("eventId", secondEvent.getEventId()));
    redis.opsForStream().read(
        org.springframework.data.redis.connection.stream.Consumer.from(
            "payment-notifications-v1", "worker-interrompido"),
        org.springframework.data.redis.connection.stream.StreamOffset.create(
            "cohida:payment-events:v1",
            org.springframework.data.redis.connection.stream.ReadOffset
                .lastConsumed()));
    redis.execute((org.springframework.data.redis.core.RedisCallback<Object>)
        connection -> connection.execute("XCLAIM",
            "cohida:payment-events:v1".getBytes(),
            "payment-notifications-v1".getBytes(),
            "worker-interrompido".getBytes(), "0".getBytes(),
            recordId.getValue().getBytes(), "IDLE".getBytes(),
            "45000".getBytes(), "JUSTID".getBytes()));
    pollUntilComplete(queue, secondEvent.getEventId());
    assertTrue(paymentOutbox.findById(secondEvent.getEventId()).orElseThrow()
        .isComplete());
    assertEquals(2, notifications
        .findByCustomerIdOrderByCreatedAtDesc(customerId)
        .stream().filter(n -> n.getType().equals("PAYMENT_APPROVED")).count());
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_REDIS_PORT",
      matches = "56379")
  void queueRetriesAfterNotificationFailure() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    var order = orders.checkout(customerId, addressId, cardId);
    var event = paymentOutbox.findByOrderId(order.getId()).orElseThrow();
    var failOnce = new java.util.concurrent.atomic.AtomicBoolean(true);
    doAnswer(invocation -> {
      Customer recipient = invocation.getArgument(0);
      if (recipient.getId().equals(customerId) && failOnce.getAndSet(false))
        throw new IllegalStateException("Falha de teste");
      return invocation.callRealMethod();
    }).when(notificationService).notify(any(), anyString(), anyString(),
        anyString());
    var queue = new PaymentQueue(redis, paymentOutbox, eventHandler,
        transactions);
    for (int index = 0; index < 30; index++) {
      queue.poll();
      Integer attempts = jdbc.queryForObject(
          "select attempts from payment_outbox where event_id = ?",
          Integer.class, event.getEventId());
      if (attempts != null && attempts > 0) break;
    }
    assertFalse(paymentOutbox.findById(event.getEventId()).orElseThrow()
        .isComplete());
    assertEquals(1, jdbc.queryForObject(
        "select attempts from payment_outbox where event_id = ?",
        Integer.class, event.getEventId()));
    jdbc.update("update payment_outbox set next_attempt_at = null "
        + "where event_id = ?", event.getEventId());
    pollUntilComplete(queue, event.getEventId());
    assertTrue(paymentOutbox.findById(event.getEventId()).orElseThrow()
        .isComplete());
    assertEquals(1, notifications
        .findByCustomerIdOrderByCreatedAtDesc(customerId)
        .stream().filter(n -> n.getType().equals("PAYMENT_APPROVED")).count());
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_REDIS_PORT",
      matches = "56379")
  void queueKeepsTheEventWhenRedisIsUnavailable() throws Exception {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    var order = orders.checkout(customerId, addressId, cardId);
    var event = paymentOutbox.findByOrderId(order.getId()).orElseThrow();
    int unusedPort;
    try (var socket = new java.net.ServerSocket(0)) {
      unusedPort = socket.getLocalPort();
    }
    var factory = new org.springframework.data.redis.connection.lettuce
        .LettuceConnectionFactory("127.0.0.1", unusedPort);
    factory.afterPropertiesSet();
    try {
      var offline = new StringRedisTemplate(factory);
      offline.afterPropertiesSet();
      var offlineQueue = new PaymentQueue(
          offline, paymentOutbox, eventHandler, transactions);
      offlineQueue.poll();
    } finally {
      factory.destroy();
    }
    assertFalse(paymentOutbox.findById(event.getEventId()).orElseThrow()
        .isComplete());
    pollUntilComplete(new PaymentQueue(redis, paymentOutbox, eventHandler,
        transactions), event.getEventId());
    assertTrue(paymentOutbox.findById(event.getEventId()).orElseThrow()
        .isComplete());
  }

  private void pollUntilComplete(PaymentQueue queue, String eventId) {
    for (int index = 0; index < 30; index++) {
      queue.poll();
      if (paymentOutbox.findById(eventId).orElseThrow().isComplete()) return;
    }
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void salesChartCountsOnlyEligibleStatusesAndRespectsDateAndDiscount() {
    transactions.executeWithoutResult(transaction -> {
      var customer = customers.findById(customerId).orElseThrow();
      String suffix = UUID.randomUUID().toString().substring(0, 8);
      var otherCategory = categories.save(
          new Category("other-" + suffix, "Outra", "Outra"));
      var otherProduct = products.create(new ProductUpsertRequest(
          "Outro", "Marca", "Teste", null, List.of(otherCategory.getId()),
          1, true, List.of(new ProductVariantRequest(
              suffix, "Único", "Preto", "Único", 20_000L, 2))));
      Long otherVariant = otherProduct.getVariants().getFirst().getId();
      String[] statuses = {
        "APROVADA", "EM_TRANSITO", "ENTREGUE", "REPROVADA", "CANCELADO",
        "EM_PROCESSAMENTO", "APROVADA", "APROVADA"
      };
      String[] dates = {
        "2024-01-01T00:00:00", "2024-01-15T12:00:00", "2024-02-01T23:59:59",
        "2024-01-10T12:00:00", "2024-01-10T12:00:00", "2024-01-10T12:00:00",
        "2024-02-02T00:00:00", "2023-12-31T23:59:59"
      };
      for (int index = 0; index < statuses.length; index++) {
        var order = new SaleOrder(customer, 30_000, 3_001, 0, null,
            "VISA", "1111", "Entrega", "Rua", "1", "Centro",
            "01001000", "São Paulo", "SP", "Brasil");
        order.addItem(new OrderItem(variantId, "Um", "A", "Único", 10_000, 1));
        order.addItem(new OrderItem(
            otherVariant, "Dois", "B", "Único", 20_000, 1));
        orderRepository.saveAndFlush(order);
        jdbc.update("update orders set status = ?, created_at = ? where id = ?",
            statuses[index], LocalDateTime.parse(dates[index]), order.getId());
      }
      var points = analytics.sales(LocalDate.of(2024, 1, 1),
          LocalDate.of(2024, 2, 1), List.of(categoryId, otherCategory.getId()));
      assertEquals(4, points.size());
      assertEquals(18_000, points.get(0).revenueCents());
      assertEquals(2, points.get(0).orders());
      assertEquals(35_998, points.get(1).revenueCents());
      assertEquals(9_000, points.get(2).revenueCents());
      assertEquals(17_999, points.get(3).revenueCents());
      assertEquals(1, points.get(3).orders());
      transaction.setRollbackOnly();
    });
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void overviewAndTopAggregateMatchingOrdersWithoutDuplicatingCategories() {
    transactions.executeWithoutResult(transaction -> {
      var customer = customers.findById(customerId).orElseThrow();
      String sku = variants.findById(variantId).orElseThrow().getSku();
      var order = new SaleOrder(customer, 30_000, 3_000, 0, null,
          "VISA", "1111", "Entrega", "Rua", "1", "Centro",
          "01001000", "São Paulo", "SP", "Brasil");
      order.addItem(new OrderItem(variantId, "Um", sku, "Único", 10_000, 1));
      order.addItem(new OrderItem(variantId, "Outro", "OUTRO-" + sku,
          "Único", 20_000, 1));
      orderRepository.saveAndFlush(order);
      jdbc.update("update orders set status = 'APROVADA', created_at = ? "
          + "where id = ?", LocalDateTime.parse("1901-01-01T23:59:59"),
          order.getId());
      var overview = analytics.overview(LocalDate.of(1901, 1, 1),
          LocalDate.of(1901, 1, 1), List.of(categoryId, categoryId));
      assertEquals(1, overview.orders());
      assertEquals(27_000, overview.revenueCents());
      assertEquals(3_000, overview.discountsCents());
      var top = analytics.top(LocalDate.of(1901, 1, 1),
          LocalDate.of(1901, 1, 1), List.of(categoryId));
      assertEquals(2, top.size());
      assertEquals("OUTRO-" + sku, top.getFirst().sku());
      assertEquals(20_000, top.getFirst().revenueCents());
      assertEquals(0, analytics.overview(LocalDate.of(1901, 1, 2),
          LocalDate.of(1901, 1, 2), null).orders());
      jdbc.update(
          "update products set active = false where id = "
          + "(select product_id from product_variants where id = ?)",
          variantId);
      assertEquals(0, analytics.overview(LocalDate.of(1901, 1, 1),
          LocalDate.of(1901, 1, 1), List.of(categoryId)).orders());
      transaction.setRollbackOnly();
    });
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void catalogSearchPaginatesAndTreatsAccentsAndWildcardsLiterally() {
    transactions.executeWithoutResult(transaction -> {
      String suffix = UUID.randomUUID().toString().substring(0, 8);
      for (int index = 0; index < 3; index++) {
        products.create(new ProductUpsertRequest(
            "Tênis " + suffix + " " + index, "Marca", "Teste", null,
            List.of(categoryId), 1, true, List.of(new ProductVariantRequest(
                suffix + index, "Único", "Preto", "Único", 1_000L, 1))));
      }
      entityManager.flush();
      var page = products.findPublicPage("tenis " + suffix, categoryId, 1, 2);
      assertEquals(3, page.total());
      assertEquals(1, page.products().size());
      assertEquals(0, products.findPublicPage(
          "tenis %" + suffix, categoryId, 0, 2).total());
      assertEquals(0, products.findPublicPage(
          "tenis " + suffix, -1L, 0, 2).total());
      transaction.setRollbackOnly();
    });
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void demoSeedPreservesCatalogAndDoesNotDuplicateCouponsOnRepeat() {
    transactions.executeWithoutResult(transaction -> {
      var first = demoSeeder.seed();
      var second = demoSeeder.seed();
      assertEquals(first.get("products"), second.get("products"));
      assertEquals(first.get("coupons"), second.get("coupons"));
      assertEquals(first.get("orders"), second.get("orders"));
      assertTrue(variants.existsBySku("DEMO-BAL-001"));
      assertTrue(variants.existsBySku("DEMO-RUN-001"));
      transaction.setRollbackOnly();
    });
  }

  @Test
  @EnabledIfEnvironmentVariable(
      named = "CACHE_TEST_REDIS_PORT", matches = "56380")
  void categoryCacheInvalidatesAfterCommitButNotRollback() {
    categoryCache.invalidate();
    var before = categoryCache.get(() -> categoryService.findAll().stream()
        .map(com.hida.cohida.category.dto.CategoryResponse::from).toList());
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    transactions.executeWithoutResult(transaction -> {
      categoryService.create(new com.hida.cohida.category.dto.CategoryRequest(
          "Rollback " + suffix, "teste"));
      transaction.setRollbackOnly();
    });
    assertEquals(before, categoryCache.get(() -> List.of()));
    transactions.executeWithoutResult(transaction -> categoryService.create(
        new com.hida.cohida.category.dto.CategoryRequest(
            "Commit " + suffix, "teste")));
    var after = categoryCache.get(() -> categoryService.findAll().stream()
        .map(com.hida.cohida.category.dto.CategoryResponse::from).toList());
    assertTrue(after.stream()
        .anyMatch(row -> row.name().equals("Commit " + suffix)));
    assertFalse(after.stream()
        .anyMatch(row -> row.name().equals("Rollback " + suffix)));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "MINIO_TEST_PORT", matches = "59000")
  @EnabledIfEnvironmentVariable(
      named = "CHECKOUT_TEST_REDIS_PORT", matches = "56381")
  void imageQueuePersistsOutputAndDeduplicatesRepeatedMessage() {
    byte[] source = "imagem original"
        .getBytes(java.nio.charset.StandardCharsets.UTF_8);
    byte[] output = "imagem convertida"
        .getBytes(java.nio.charset.StandardCharsets.UTF_8);
    when(imageTransformer.convert(any())).thenReturn(output);
    String url = imageService.getObject().enqueue(source, "image/png");
    String id = url.substring(url.lastIndexOf('/') + 1, url.length() - 5);
    var queue = new com.hida.cohida.image.ImageQueue(redis, imageJobs,
        imageHandler.getObject(), transactions);
    for (int index = 0; index < 10; index++) {
      queue.poll();
      if ("READY".equals(imageService.getObject().status(id))) break;
    }
    assertEquals("READY", imageService.getObject().status(id));
    assertArrayEquals(output, imageStorage.getObject().get(
        com.hida.cohida.image.ImageJobService.outputKey(id)));
    redis.opsForStream().add(
        "cohida:image-events:v1", java.util.Map.of("eventId", id));
    queue.poll();
    verify(imageTransformer, times(1)).convert(any());
    imageStorage.getObject().delete(
        com.hida.cohida.image.ImageJobService.outputKey(id));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "MINIO_TEST_PORT", matches = "59000")
  @EnabledIfEnvironmentVariable(
      named = "CHECKOUT_TEST_REDIS_PORT", matches = "56381")
  void imageFailureCanBeRetriedAndExpiredClaimCannotComplete() {
    byte[] source = {1, 2, 3};
    byte[] output = {4, 5, 6};
    when(imageTransformer.convert(any()))
        .thenThrow(new IllegalArgumentException("imagem inválida"))
        .thenReturn(output);
    String url = imageService.getObject().enqueue(source, "image/png");
    String id = url.substring(url.lastIndexOf('/') + 1, url.length() - 5);
    String oldToken = imageService.getObject().claim(id);
    jdbc.update("update product_image_jobs set claimed_until = ? where id = ?",
        LocalDateTime.now().minusSeconds(1), id);
    String newToken = imageService.getObject().claim(id);
    assertNotEquals(oldToken, newToken);
    assertFalse(imageService.getObject().finish(id, oldToken));
    jdbc.update("update product_image_jobs set claimed_until = ? where id = ?",
        LocalDateTime.now().minusSeconds(1), id);
    var queue = new com.hida.cohida.image.ImageQueue(redis, imageJobs,
        imageHandler.getObject(), transactions);
    queue.poll();
    assertEquals("FAILED", imageService.getObject().status(id));
    imageService.getObject().retry(id);
    queue.poll();
    assertEquals("READY", imageService.getObject().status(id));
    assertArrayEquals(output, imageStorage.getObject().get(
        com.hida.cohida.image.ImageJobService.outputKey(id)));
    imageStorage.getObject().delete(
        com.hida.cohida.image.ImageJobService.outputKey(id));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "MINIO_TEST_PORT", matches = "59000")
  @EnabledIfEnvironmentVariable(
      named = "CHECKOUT_TEST_REDIS_PORT", matches = "56381")
  void imageQueueRecoversMessageFromInterruptedWorker() {
    byte[] output = {7, 8, 9};
    when(imageTransformer.convert(any())).thenReturn(output);
    var queue = new com.hida.cohida.image.ImageQueue(redis, imageJobs,
        imageHandler.getObject(), transactions);
    queue.poll();
    String url = imageService.getObject().enqueue(new byte[] {1}, "image/png");
    String id = url.substring(url.lastIndexOf('/') + 1, url.length() - 5);
    String stream = "cohida:image-events:v1";
    String group = "image-processing-v1";
    var record = redis.opsForStream().add(
        stream, java.util.Map.of("eventId", id));
    redis.opsForStream().read(
        org.springframework.data.redis.connection.stream.Consumer.from(
            group, "dead"),
        org.springframework.data.redis.connection.stream.StreamOffset.create(
            stream, org.springframework.data.redis.connection.stream.ReadOffset
                .lastConsumed()));
    redis.execute((org.springframework.data.redis.core.RedisCallback<Object>)
        connection -> connection.execute("XCLAIM", stream.getBytes(),
            group.getBytes(), "dead".getBytes(), "0".getBytes(),
            record.getValue().getBytes(), "IDLE".getBytes(),
            "45000".getBytes(), "JUSTID".getBytes()));
    queue.poll();
    assertEquals("READY", imageService.getObject().status(id));
    verify(imageTransformer, times(1)).convert(any());
    imageStorage.getObject().delete(
        com.hida.cohida.image.ImageJobService.outputKey(id));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "MINIO_TEST_PORT", matches = "59000")
  @EnabledIfEnvironmentVariable(
      named = "CHECKOUT_TEST_REDIS_PORT", matches = "56381")
  void imageJobRemainsPendingWhileRedisIsOffline() throws Exception {
    when(imageTransformer.convert(any())).thenReturn(new byte[] {4});
    String url = imageService.getObject().enqueue(new byte[] {1}, "image/png");
    String id = url.substring(url.lastIndexOf('/') + 1, url.length() - 5);
    int unusedPort;
    try (var socket = new java.net.ServerSocket(0)) {
      unusedPort = socket.getLocalPort();
    }
    var factory = new org.springframework.data.redis.connection.lettuce
        .LettuceConnectionFactory("127.0.0.1", unusedPort);
    factory.afterPropertiesSet();
    try {
      var offline = new StringRedisTemplate(factory);
      offline.afterPropertiesSet();
      new com.hida.cohida.image.ImageQueue(offline, imageJobs,
          imageHandler.getObject(), transactions).poll();
    } finally {
      factory.destroy();
    }
    assertEquals("PROCESSING", imageService.getObject().status(id));
    new com.hida.cohida.image.ImageQueue(redis, imageJobs,
        imageHandler.getObject(), transactions).poll();
    assertEquals("READY", imageService.getObject().status(id));
    imageStorage.getObject().delete(
        com.hida.cohida.image.ImageJobService.outputKey(id));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void refreshTokenRotationSerializesAndAuditRedactsHash() throws Exception {
    Long accountId = jdbc.queryForObject(
        "select id from accounts where customer_id = ?",
        Long.class, customerId);
    String access = jwtService.createAccessToken(accountId, customerId,
        "test@example.test", AccountRole.CUSTOMER);
    var issued = sessions.issue(new AuthenticationResponse(
        access, "Bearer", 3600, customerId, "Cliente", "CUSTOMER", null));
    String id = issued.authentication().sessionId();
    var start = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> {
        start.await();
        return sessions.refresh(id, issued.secret());
      });
      var second = executor.submit(() -> {
        start.await();
        return sessions.refresh(id, issued.secret());
      });
      start.countDown();
      var firstResult = first.get(10, TimeUnit.SECONDS);
      var secondResult = second.get(10, TimeUnit.SECONDS);
      assertEquals(firstResult.secret(), secondResult.secret());
    }
    assertEquals("[REDACTED]", jdbc.queryForObject(
        "select after_values->>'refresh_token_hash' from audit_log "
            + "where table_name = 'auth_sessions' and record_key->>'id' = ? "
            + "order by id desc limit 1", String.class, id));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void passwordChangeRevokesExistingRefreshSessions() {
    transactions.executeWithoutResult(transaction -> {
      var customer = customers.findById(customerId).orElseThrow();
      StringBuilder cpf = new StringBuilder(String.format("%09d", customerId));
      for (int position = 9; position <= 10; position++) {
        int sum = 0;
        for (int index = 0; index < position; index++) {
          sum += (cpf.charAt(index) - '0') * (position + 1 - index);
        }
        int digit = (sum * 10) % 11;
        cpf.append(digit == 10 ? 0 : digit);
      }
      jdbc.update("update customers set cpf = ? where id = ?", cpf.toString(),
          customerId);
      customer.getAccount().changePassword(encoder.encode("Old@1234"));
      customer.addAddress(new CustomerAddress(
          "Cobrança", AddressType.BILLING, "Rua A", "1", "Centro",
          "01001000", "São Paulo", "SP", "Brasil"));
    });
    Long accountId = jdbc.queryForObject(
        "select id from accounts where customer_id = ?",
        Long.class, customerId);
    String access = jwtService.createAccessToken(
        accountId, customerId, "test@example.test", AccountRole.CUSTOMER);
    var issued = sessions.issue(new AuthenticationResponse(
        access, "Bearer", 3600, customerId, "Cliente", "CUSTOMER", null));
    customerService.changePassword(customerId,
        new com.hida.cohida.customer.dto.PasswordUpdateRequest(
            "Old@1234", "New@1234", "New@1234"));
    assertThrows(InvalidCredentialsException.class,
        () -> sessions.refresh(
            issued.authentication().sessionId(), issued.secret()));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void cleanupRemovesOnlySessionsPastRetention() {
    Long accountId = jdbc.queryForObject(
        "select id from accounts where customer_id = ?",
        Long.class, customerId);
    String oldId = UUID.randomUUID().toString();
    String recentId = UUID.randomUUID().toString();
    LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
    for (String id : List.of(oldId, recentId)) {
      jdbc.update(
          "insert into auth_sessions (id, account_id, refresh_token_hash, "
          + "created_at, expires_at) values (?, ?, ?, ?, ?)", id, accountId,
          "hash", now.minusDays(100),
          id.equals(oldId) ? now.minusDays(31) : now.plusDays(1));
    }
    cleanup.clean();
    assertEquals(0L, jdbc.queryForObject(
        "select count(*) from auth_sessions where id = ?", Long.class, oldId));
    assertEquals(1L, jdbc.queryForObject(
        "select count(*) from auth_sessions where id = ?",
        Long.class, recentId));
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void auditRecordsActorAndChangesWithoutSecretsAndRollsBack() {
    Long accountId = jdbc.queryForObject(
        "select id from accounts where customer_id = ?", Long.class,
        customerId);
    Long before = jdbc.queryForObject(
        "select count(*) from audit_log where table_name = 'categories' "
            + "and record_key->>'id' = ?", Long.class, categoryId.toString());
    var principal = new AuthenticatedCustomer(
        accountId, customerId, "audit@example.test", AccountRole.CUSTOMER);
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    try {
      transactions.executeWithoutResult(transaction -> {
        jdbc.update("update categories set name = ? where id = ?",
            "Novo nome", categoryId);
        jdbc.update("update accounts set password_hash = ? where id = ?",
            "segredo-do-teste", accountId);
        var audit = jdbc.queryForMap(
            "select actor_kind, actor_id, before_values->>'name' as old_name, "
                + "after_values->>'name' as new_name from audit_log "
                + "where table_name = 'categories' and operation = 'UPDATE' "
                + "and record_key->>'id' = ? order by id desc limit 1",
            categoryId.toString());
        assertEquals("ACCOUNT", audit.get("actor_kind"));
        assertEquals(accountId.toString(), audit.get("actor_id"));
        assertEquals("Teste", audit.get("old_name"));
        assertEquals("Novo nome", audit.get("new_name"));
        assertEquals("[REDACTED]", jdbc.queryForObject(
            "select after_values->>'password_hash' from audit_log "
                + "where table_name = 'accounts' and operation = 'UPDATE' "
                + "and record_key->>'id' = ? order by id desc limit 1",
            String.class, accountId.toString()));
        Long messageId = jdbc.queryForObject(
            "insert into chat_responses (customer_id, question, response, "
                + "model, created_at) values (?, ?, ?, ?, now()) returning id",
            Long.class, customerId, "pergunta privada", "resposta privada",
            "teste");
        assertEquals("[REDACTED]", jdbc.queryForObject(
            "select after_values->>'question' from audit_log "
                + "where table_name = 'chat_responses' "
                + "and operation = 'INSERT' "
                + "and record_key->>'id' = ? order by id desc limit 1",
            String.class, messageId.toString()));
        chat.feedback(customerId, messageId, true);
        assertEquals("ACCOUNT", jdbc.queryForObject(
            "select actor_kind from audit_log where table_name = "
                + "'chat_responses' and operation = 'UPDATE' "
                + "and record_key->>'id' = ? order by id desc limit 1",
            String.class, messageId.toString()));
        transaction.setRollbackOnly();
      });
    } finally {
      SecurityContextHolder.clearContext();
    }
    assertEquals(before, jdbc.queryForObject(
        "select count(*) from audit_log where table_name = 'categories' "
            + "and record_key->>'id' = ?", Long.class, categoryId.toString()));
    assertEquals(0, jdbc.queryForObject(
        "select count(*) from pg_tables t where t.schemaname = 'cohida' "
            + "and t.tablename not in ('audit_log', 'flyway_schema_history') "
            + "and not exists (select 1 from pg_trigger g "
            + "where g.tgrelid = to_regclass('cohida.' || t.tablename) "
            + "and g.tgname = 'audit_write' and not g.tgisinternal)",
        Integer.class));
    var request = org.springframework.web.context.request.RequestContextHolder
        .getRequestAttributes();
    org.springframework.web.context.request.RequestContextHolder
        .resetRequestAttributes();
    try {
      transactions.executeWithoutResult(transaction -> {
        jdbc.update("update categories set name = ? where id = ?",
            "Mudança do sistema", categoryId);
        assertEquals("SYSTEM", jdbc.queryForObject(
            "select actor_kind from audit_log where table_name = 'categories' "
                + "and record_key->>'id' = ? order by id desc limit 1",
            String.class, categoryId.toString()));
        transaction.setRollbackOnly();
      });
    } finally {
      org.springframework.web.context.request.RequestContextHolder
          .setRequestAttributes(request);
    }
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void clearingChatDuringGenerationPreventsRestoringDeletedHistory()
      throws Exception {
    var started = new CountDownLatch(1);
    var release = new CountDownLatch(1);
    when(chatModel.call(any(org.springframework.ai.chat.prompt.Prompt.class)))
        .thenAnswer(invocation -> {
          assertFalse(TransactionSynchronizationManager
              .isActualTransactionActive());
          started.countDown();
          assertTrue(release.await(10, TimeUnit.SECONDS));
          return new org.springframework.ai.chat.model.ChatResponse(List.of(
              new org.springframework.ai.chat.model.Generation(
                  new org.springframework.ai.chat.messages.AssistantMessage(
                      "{\"content\":\"Olá\",\"productSlugs\":[]}"))));
        });
    try (var executor = Executors.newSingleThreadExecutor()) {
      var result = executor.submit(() -> chat.respond(customerId,
          new com.hida.cohida.chat.ChatController.ChatRequest("Olá", null)));
      assertTrue(started.await(10, TimeUnit.SECONDS));
      try {
        chat.clearHistory(customerId);
      } finally {
        release.countDown();
      }
      var error = assertThrows(ExecutionException.class,
          () -> result.get(10, TimeUnit.SECONDS));
      assertInstanceOf(com.hida.cohida.auth.exception.ConflictException.class,
          error.getCause());
      assertTrue(chat.history(customerId).isEmpty());
    }
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void preferenceChangesInvalidateSuggestionsGeneratedInFlight()
      throws Exception {
    chat.savePreferences(customerId, "Judô");
    var started = new CountDownLatch(1);
    var release = new CountDownLatch(1);
    when(chatModel.call(any(org.springframework.ai.chat.prompt.Prompt.class)))
        .thenAnswer(invocation -> {
          assertFalse(TransactionSynchronizationManager
              .isActualTransactionActive());
          started.countDown();
          assertTrue(release.await(10, TimeUnit.SECONDS));
          return new org.springframework.ai.chat.model.ChatResponse(List.of(
              new org.springframework.ai.chat.model.Generation(
                  new org.springframework.ai.chat.messages.AssistantMessage(
                      "{\"questions\":[\"Qual judogi escolher?\"]}"))));
        });
    try (var executor = Executors.newSingleThreadExecutor()) {
      var result = executor.submit(() -> chat.generateSuggestions(customerId));
      assertTrue(started.await(10, TimeUnit.SECONDS));
      try {
        chat.savePreferences(customerId, "Corrida");
        chat.savePreferences(customerId, "Judô");
      } finally {
        release.countDown();
      }
      assertTrue(result.get(10, TimeUnit.SECONDS).questions().isEmpty());
      assertTrue(chat.suggestions(customerId).isEmpty());
    }
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "CHECKOUT_TEST_JDBC_URL",
      matches = "jdbc:postgresql://.*cohida_checkout_test")
  void historyLoadsProductsForSeveralResponses() {
    transactions.executeWithoutResult(transaction -> {
      String slug = jdbc.queryForObject(
          "select p.slug from products p join product_variants v "
              + "on v.product_id = p.id where v.id = ?",
          String.class, variantId);
      for (int index = 0; index < 2; index++) {
        Long id = jdbc.queryForObject(
            "insert into chat_responses (customer_id, question, response, "
                + "model, created_at) values (?, ?, ?, ?, now()) returning id",
            Long.class, customerId, "pergunta", "resposta", "teste");
        jdbc.update("insert into chat_response_products "
            + "(response_id, product_slug, position) values (?, ?, ?)",
            id, slug, 0);
      }
      var history = chat.historyWithProducts(customerId);
      assertEquals(2, history.size());
      assertEquals(slug, history.get(0).products().getFirst().slug());
      assertEquals(slug, history.get(1).products().getFirst().slug());
      transaction.setRollbackOnly();
    });
  }

  @Test
  void replayReturnsOriginalSnapshotAfterOrderStatusChanges() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    String key = UUID.randomUUID().toString();
    var payments = List.of(
        new com.hida.cohida.order.dto.PaymentAllocationRequest(cardId, null));
    var original =
        checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature);
    orders.dispatch(original.id(), "RASTREIO-TESTE");
    var replay =
        checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature);
    assertEquals(original, replay);
    assertEquals(OrderStatus.APROVADA, replay.status());
    assertEquals(OrderStatus.EM_TRANSITO,
        orderRepository.findById(original.id()).orElseThrow().getStatus());
  }

  @Test
  void idempotencyKeysAreIsolatedByCustomer() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    String key = UUID.randomUUID().toString();
    var payments = List.of(
        new com.hida.cohida.order.dto.PaymentAllocationRequest(cardId, null));
    checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature);
    Long otherCustomerId = createCustomer();
    assertThrows(com.hida.cohida.auth.exception.InvalidRequestException.class,
        () -> checkout.checkoutIdempotent(
            otherCustomerId, key, addressId, payments, cartSignature));
    assertTrue(orderRepository
        .findByCustomerIdOrderByCreatedAtDesc(otherCustomerId).isEmpty());
  }

  @Test
  void simultaneousRequestsWithSameKeyReturnOneOrder() throws Exception {
    String key = UUID.randomUUID().toString();
    var payments = List.of(
        new com.hida.cohida.order.dto.PaymentAllocationRequest(cardId, null));
    var processing = new CountDownLatch(1);
    var release = new CountDownLatch(1);
    var secondStarted = new CountDownLatch(1);
    when(processor.authorize(anyList(), anyLong())).thenAnswer(invocation -> {
      processing.countDown();
      if (!release.await(5, TimeUnit.SECONDS))
        throw new IllegalStateException("Tempo de espera excedido");
      return PaymentAuthorization.accepted();
    });
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(
          () ->
              checkout.checkoutIdempotent(
                  customerId, key, addressId, payments, cartSignature));
      assertTrue(processing.await(5, TimeUnit.SECONDS));
      var second = executor.submit(() -> {
        secondStarted.countDown();
        return checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature);
      });
      try {
        assertTrue(secondStarted.await(5, TimeUnit.SECONDS));
        assertThrows(TimeoutException.class,
            () -> second.get(200, TimeUnit.MILLISECONDS));
      } finally {
        release.countDown();
      }
      assertEquals(first.get(10, TimeUnit.SECONDS),
          second.get(10, TimeUnit.SECONDS));
    }
    assertEquals(1, orderRepository
        .findByCustomerIdOrderByCreatedAtDesc(customerId).size());
    verify(processor, times(1)).authorize(anyList(), anyLong());
  }

  @Test
  void failedAttemptCanBeRetriedWithSameKey() {
    String key = UUID.randomUUID().toString();
    var payments = List.of(
        new com.hida.cohida.order.dto.PaymentAllocationRequest(cardId, null));
    when(processor.authorize(anyList(), anyLong()))
        .thenThrow(new IllegalStateException("Falha simulada"))
        .thenReturn(PaymentAuthorization.accepted());
    assertThrows(IllegalStateException.class,
        () ->
            checkout.checkoutIdempotent(
                customerId, key, addressId, payments, cartSignature));
    assertTrue(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
    var response =
        checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature);
    assertEquals(OrderStatus.APROVADA, response.status());
    assertEquals(1, orderRepository
        .findByCustomerIdOrderByCreatedAtDesc(customerId).size());
  }

  @Test
  void retryDoesNotPurchaseAnAlteredCart() {
    String key = UUID.randomUUID().toString();
    var payments = List.of(
        new com.hida.cohida.order.dto.PaymentAllocationRequest(cardId, null));
    carts.add(customerId, variantId, 1);
    assertThrows(com.hida.cohida.auth.exception.InvalidRequestException.class,
        () -> checkout.checkoutIdempotent(
            customerId, key, addressId, payments, cartSignature));
    assertTrue(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
    assertEquals(2, carts.view(customerId).items().getFirst().quantity());
    verifyNoInteractions(processor);
  }

  @Test
  void changedStockCommitsCartAdjustmentBeforeReturningError() {
    transactions.executeWithoutResult(status ->
        variants.findById(variantId).orElseThrow().updateStock(0));
    assertThrows(com.hida.cohida.auth.exception.InvalidRequestException.class,
        () -> orders.checkout(customerId, addressId, cardId));
    assertTrue(carts.view(customerId).items().isEmpty());
    assertTrue(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
    verifyNoInteractions(processor);
  }

  @Test
  void expiredReservationIsRemovedBeforeCheckout() {
    transactions.executeWithoutResult(status -> {
      var cart = cartRepository.findForUpdateByCustomerId(customerId)
          .orElseThrow();
      cart.getItems().getFirst()
          .reserve(1, LocalDateTime.now().minusMinutes(1));
    });
    assertThrows(com.hida.cohida.auth.exception.InvalidRequestException.class,
        () -> orders.checkout(customerId, addressId, cardId));
    assertTrue(carts.view(customerId).items().isEmpty());
    assertEquals(1, carts.expired(customerId).size());
    assertTrue(orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
    verifyNoInteractions(processor);
  }

  @Test
  void reservationWarningResetsWhenReservationIsRenewed() {
    LocalDateTime now = LocalDateTime.now();
    transactions.executeWithoutResult(status -> {
      var cart = cartRepository.findForUpdateByCustomerId(customerId)
          .orElseThrow();
      cart.getItems().getFirst().reserve(1, now.plusMinutes(4));
    });
    assertTrue(cartRepository.findCustomersWithDueReservations(now,
        now.plusMinutes(5), 0L, org.springframework.data.domain.PageRequest
            .of(0, 1000)).contains(customerId));
    reservations.processDue(customerId, now);
    reservations.processDue(customerId, now);
    assertEquals(1, notifications
        .findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
        .filter(item -> item.getType().equals("CART_RESERVATION_EXPIRING"))
        .count());
    transactions.executeWithoutResult(status -> {
      var cart = cartRepository.findForUpdateByCustomerId(customerId)
          .orElseThrow();
      cart.getItems().getFirst().reserve(1, now.plusMinutes(3));
    });
    reservations.processDue(customerId, now);
    assertEquals(2, notifications
        .findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
        .filter(item -> item.getType().equals("CART_RESERVATION_EXPIRING"))
        .count());
    transactions.executeWithoutResult(status -> {
      var cart = cartRepository.findForUpdateByCustomerId(customerId)
          .orElseThrow();
      cart.getItems().getFirst().reserve(1, now.minusMinutes(1));
    });
    reservations.processDue(customerId, now);
    reservations.processDue(customerId, now);
    assertTrue(carts.view(customerId).items().isEmpty());
    assertEquals(1, carts.expired(customerId).size());
  }

  @Test
  void concurrentReturnCompletionIssuesOneCouponAndRestocksOnce()
      throws Exception {
    var order = deliveredOrder();
    var request = returnService.request(customerId, order.getId(), null,
        "Solicitação de troca");
    assertTrue(returnService.customerReturns(customerId).stream()
        .anyMatch(item -> item.getId().equals(request.getId())));
    assertTrue(returnService.customerReturns(-1L).isEmpty());
    assertEquals(OrderStatus.EM_TROCA,
        orderRepository.findById(order.getId()).orElseThrow().getStatus());
    returnService.status(request.getId(), ReturnStatus.TROCA_AUTORIZADA);
    assertEquals(OrderStatus.TROCA_AUTORIZADA,
        orderRepository.findById(order.getId()).orElseThrow().getStatus());
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> {
        ready.countDown();
        start.await();
        return returnService.status(
            request.getId(), ReturnStatus.TROCADO, true);
      });
      var second = executor.submit(() -> {
        ready.countDown();
        start.await();
        return returnService.status(
            request.getId(), ReturnStatus.TROCADO, true);
      });
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      int succeeded = 0;
      for (var future : List.of(first, second)) {
        try {
          future.get(10, TimeUnit.SECONDS);
          succeeded++;
        } catch (ExecutionException error) {
          assertInstanceOf(
              com.hida.cohida.auth.exception.InvalidRequestException.class,
              error.getCause());
        }
      }
      assertEquals(1, succeeded);
    }
    assertEquals(ReturnStatus.TROCADO,
        returnRepository.findById(request.getId()).orElseThrow().getStatus());
    assertEquals(OrderStatus.TROCADO,
        orderRepository.findById(order.getId()).orElseThrow().getStatus());
    assertEquals(2,
        variants.findById(variantId).orElseThrow().getStockQuantity());
    assertEquals(1, jdbc.queryForObject(
        "select count(*) from coupons where assigned_customer_id = ?",
        Integer.class, customerId));
  }

  @Test
  void deniedWholeReturnRestoresDeliveredOrder() {
    var order = deliveredOrder();
    var request = returnService.request(customerId, order.getId(), null,
        "Solicitação de troca");
    returnService.status(request.getId(), ReturnStatus.TROCA_NEGADA);
    assertEquals(OrderStatus.ENTREGUE,
        orderRepository.findById(order.getId()).orElseThrow().getStatus());
    assertEquals(ReturnStatus.TROCA_NEGADA,
        returnRepository.findById(request.getId()).orElseThrow().getStatus());
  }

  @Test
  void concurrentWholeAndItemReturnsCannotOverlap() throws Exception {
    var order = deliveredOrder();
    Long itemId = order.getItems().getFirst().getId();
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var whole = executor.submit(() -> {
        ready.countDown();
        start.await();
        return returnService.request(customerId, order.getId(), null, "Troca");
      });
      var item = executor.submit(() -> {
        ready.countDown();
        start.await();
        return returnService.request(
            customerId, order.getId(), itemId, "Troca");
      });
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      int succeeded = 0;
      for (var future : List.of(whole, item)) {
        try {
          future.get(10, TimeUnit.SECONDS);
          succeeded++;
        } catch (ExecutionException error) {
          assertInstanceOf(
              com.hida.cohida.auth.exception.InvalidRequestException.class,
              error.getCause());
        }
      }
      assertEquals(1, succeeded);
    }
    assertEquals(1, jdbc.queryForObject(
        "select count(*) from return_requests where order_id = ?",
        Integer.class, order.getId()));
  }

  private SaleOrder deliveredOrder() {
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    var order = orders.checkout(customerId, addressId, cardId);
    orders.dispatch(order.getId(), "RASTREIO-TESTE");
    orders.changeStatus(order.getId(), OrderStatus.ENTREGUE);
    return order;
  }

  @Test
  void cancellationPreservesStockAndUnconsumedCoupons() {
    var fixture = pendingOrder();

    var cancelled = orders.cancel(customerId, fixture.orderId(), "Mudança");
    assertEquals(OrderStatus.CANCELADO, cancelled.getStatus());
    assertEquals(
        2, variants.findById(variantId).orElseThrow().getStockQuantity());
    assertEquals(
        1, coupons.findById(fixture.promoId()).getRedeemedCount());
    assertEquals(
        3_000L, coupons.findById(fixture.creditId()).getRemainingCreditCents());
    assertEquals(
        1, coupons.findById(fixture.creditId()).getRedeemedCount());
    assertEquals(1,
        notifications.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .filter(item -> item.getType().equals("ORDER_CANCELLED")).count());
    assertThrows(IllegalArgumentException.class,
        () -> orders.cancel(customerId, fixture.orderId(), "Outra tentativa"));
  }

  @Test
  void simultaneousCancellationAppliesOnlyOnce() throws Exception {
    var fixture = pendingOrder();
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> {
        ready.countDown();
        start.await();
        return orders.cancel(customerId, fixture.orderId(), "Primeira");
      });
      var second = executor.submit(() -> {
        ready.countDown();
        start.await();
        return orders.cancel(customerId, fixture.orderId(), "Segunda");
      });
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      int succeeded = 0;
      for (var future : List.of(first, second)) {
        try {
          future.get(10, TimeUnit.SECONDS);
          succeeded++;
        } catch (ExecutionException exception) {
          assertInstanceOf(
              IllegalArgumentException.class, exception.getCause());
        }
      }
      assertEquals(1, succeeded);
    }
    assertEquals(
        2, variants.findById(variantId).orElseThrow().getStockQuantity());
    assertEquals(
        1, coupons.findById(fixture.promoId()).getRedeemedCount());
    assertEquals(
        3_000L, coupons.findById(fixture.creditId()).getRemainingCreditCents());
    assertEquals(1,
        notifications.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
            .filter(item -> item.getType().equals("ORDER_CANCELLED")).count());
  }

  @Test
  void anotherCustomerCannotCancelTheOrder() {
    var fixture = pendingOrder();
    Long otherCustomerId = createCustomer();
    assertThrows(
        com.hida.cohida.order.exception.OrderNotFoundException.class,
        () -> orders.cancel(otherCustomerId, fixture.orderId(), "Teste"));
    assertEquals(OrderStatus.EM_PROCESSAMENTO,
        orderRepository.findById(fixture.orderId()).orElseThrow().getStatus());
    assertTrue(notifications.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .isEmpty());
  }

  private record PendingOrder(Long orderId, Long promoId, Long creditId) {}

  private PendingOrder pendingOrder() {
    String code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    return transactions.execute(status -> {
      var customer = customers.findById(customerId).orElseThrow();
      var promo = couponRepository.save(new Coupon(
          code, "Cupom", CouponDiscountType.FIXED_AMOUNT, 1_000L,
          null, null, null, LocalDateTime.now().minusDays(1),
          LocalDateTime.now().plusDays(1), 5, true));
      promo.registerRedemption();
      var credit = couponRepository.save(
          Coupon.returnCredit("R" + code, customer, 5_000L));
      credit.consumeCredit(2_000L);
      var order = new SaleOrder(
          customer, 20_000L, 4_000L, 0, code + "," + credit.getCode(),
          "VISA", "4242", "Entrega", "Rua A", "1", "Centro",
          "01001000", "São Paulo", "SP", "Brasil");
      order.setCouponValueCents(4_000L);
      order.addItem(new OrderItem(
          variantId, "Produto", code, "Único", 20_000L, 1));
      return new PendingOrder(
          orderRepository.save(order).getId(), promo.getId(), credit.getId());
    });
  }

  @Test
  void concurrentCheckoutsOfSameCartCreateOnlyOneOrder() throws Exception {
    var processing = new CountDownLatch(1);
    var release = new CountDownLatch(1);
    var secondStarted = new CountDownLatch(1);
    when(processor.authorize(anyList(), anyLong())).thenAnswer(invocation -> {
      processing.countDown();
      if (!release.await(5, TimeUnit.SECONDS))
        throw new IllegalStateException("Tempo de espera excedido");
      return PaymentAuthorization.accepted();
    });
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(
          () -> orders.checkout(customerId, addressId, cardId));
      assertTrue(processing.await(5, TimeUnit.SECONDS));
      var second = executor.submit(() -> {
        secondStarted.countDown();
        return orders.checkout(customerId, addressId, cardId);
      });
      try {
        assertTrue(secondStarted.await(5, TimeUnit.SECONDS));
        assertThrows(TimeoutException.class,
            () -> second.get(200, TimeUnit.MILLISECONDS));
      } finally {
        release.countDown();
      }
      first.get(10, TimeUnit.SECONDS);
      var failure = assertThrows(ExecutionException.class,
          () -> second.get(10, TimeUnit.SECONDS));
      assertInstanceOf(
          com.hida.cohida.auth.exception.InvalidRequestException.class,
          failure.getCause());
    }
    assertEquals(1, orderRepository
        .findByCustomerIdOrderByCreatedAtDesc(customerId).size());
    assertEquals(
        1, variants.findById(variantId).orElseThrow().getStockQuantity());
    assertTrue(carts.view(customerId).items().isEmpty());
  }

  @Test
  void concurrentCartsCannotReserveMoreThanAvailable() throws Exception {
    Long firstCustomer = createCustomer();
    Long secondCustomer = createCustomer();
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> {
        ready.countDown();
        start.await();
        return carts.add(firstCustomer, variantId, 1);
      });
      var second = executor.submit(() -> {
        ready.countDown();
        start.await();
        return carts.add(secondCustomer, variantId, 1);
      });
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      int succeeded = 0;
      for (var future : List.of(first, second)) {
        try {
          future.get(10, TimeUnit.SECONDS);
          succeeded++;
        } catch (ExecutionException exception) {
          assertInstanceOf(
              com.hida.cohida.auth.exception.InvalidRequestException.class,
              exception.getCause());
        }
      }
      assertEquals(1, succeeded);
    }
    assertEquals(1, carts.view(firstCustomer).items().size()
        + carts.view(secondCustomer).items().size());
  }

  @Test
  void couponWithOneUseCannotBeRedeemedTwice() throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    var other = transactions.execute(status -> {
      var customer = new Customer(
          "C-" + suffix, "Cliente", LocalDate.of(1990, 1, 1),
          String.format("%011d", Integer.toUnsignedLong(suffix.hashCode())),
          "11999999999");
      customer.attachAccount(new Account(suffix + "@example.test", "unused"));
      customer.addAddress(new CustomerAddress(
          "Entrega", AddressType.DELIVERY, "Rua A", "1", "Centro",
          "01001000", "São Paulo", "SP", "Brasil"));
      customers.save(customer);
      var card = cards.create(customer.getId(), new PaymentCardCreateRequest(
          suffix, "4242 4242 4242 4242", "Pessoal", 12, 2030));
      carts.add(customer.getId(), variantId, 1);
      return new long[] {
        customer.getId(), customer.getAddresses().getFirst().getId(),
        card.getId()
      };
    });
    var coupon = coupons.create(new CouponUpsertRequest(
        suffix.toUpperCase(), "Cupom", CouponDiscountType.FIXED_AMOUNT,
        1_000L, null, null, null, LocalDateTime.now().minusMinutes(1),
        LocalDateTime.now().plusDays(1), 1, true));
    carts.applyCoupon(customerId, coupon.getCode());
    carts.applyCoupon(other[0], coupon.getCode());
    when(processor.authorize(anyList(), anyLong()))
        .thenReturn(PaymentAuthorization.accepted());
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> {
        ready.countDown();
        start.await();
        return orders.checkout(customerId, addressId, cardId);
      });
      var second = executor.submit(() -> {
        ready.countDown();
        start.await();
        return orders.checkout(other[0], other[1], other[2]);
      });
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      int succeeded = 0;
      for (var future : List.of(first, second)) {
        try {
          future.get(10, TimeUnit.SECONDS);
          succeeded++;
        } catch (ExecutionException exception) {
          assertInstanceOf(
              com.hida.cohida.auth.exception.InvalidRequestException.class,
              exception.getCause());
        }
      }
      assertEquals(1, succeeded);
    }
    assertEquals(1, coupons.findById(coupon.getId()).getRedeemedCount());
    assertEquals(
        1, variants.findById(variantId).orElseThrow().getStockQuantity());
  }

  private Long createCustomer() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    return transactions.execute(status -> {
      var customer = new Customer(
          "C-" + suffix, "Cliente", LocalDate.of(1990, 1, 1),
          String.format("%011d", Integer.toUnsignedLong(suffix.hashCode())),
          "11999999999");
      customer.attachAccount(new Account(suffix + "@example.test", "unused"));
      return customers.save(customer).getId();
    });
  }
}
