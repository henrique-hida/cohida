package com.hida.cohida.demo;

import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.coupon.service.CouponService;
import com.hida.cohida.account.repository.AccountRepository;
import com.hida.cohida.category.repository.CategoryRepository;
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
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.domain.ProductReview;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductReviewRepository;
import com.hida.cohida.product.repository.ProductVariantRepository;
import com.hida.cohida.product.service.ProductService;
import com.hida.cohida.returnrequest.domain.ReturnStatus;
import com.hida.cohida.returnrequest.service.ReturnService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DemoSeederService {
  private final ProductService products;
  private final CategoryRepository categoryRepo;
  private final ProductRepository productRepo;
  private final CouponService coupons;
  private final CouponRepository couponRepo;
  private final AccountRepository accounts;
  private final AuthService auth;
  private final PaymentCardService cards;
  private final OrderRepository orders;
  private final ProductVariantRepository variants;
  private final ProductReviewRepository productReviews;
  private final ReturnService returns;

  public DemoSeederService(
      ProductService p,
      ProductRepository pr,
      CategoryRepository categoryRepo,
      CouponService c,
      CouponRepository cr,
      AccountRepository a,
      AuthService as,
      PaymentCardService pcs,
      OrderRepository or,
      ProductVariantRepository vr,
      ReturnService rs,
      ProductReviewRepository productReviews) {
    products = p;
    productRepo = pr;
    this.categoryRepo = categoryRepo;
    coupons = c;
    couponRepo = cr;
    accounts = a;
    auth = as;
    cards = pcs;
    orders = or;
    variants = vr;
    returns = rs;
    this.productReviews = productReviews;
  }

  @Transactional
  public Map<String, Integer> seed() {
    Map<String, Product> productsBySku = new HashMap<>();
    for (Product product : demoCatalogProducts()) {
      String cleanName = cleanProductName(product.getName());
      if (!cleanName.equals(product.getName())) {
        product.update(
            cleanName,
            product.getBrand(),
            product.getDescription(),
            product.getImageUrl(),
            product.getMinimumStock(),
            product.isActive(),
            product.getCategories());
        product.updateSlug(slugify(cleanName));
      }
      for (ProductVariant variant : product.getVariants()) {
        if (variant.getSku().startsWith("DEMO-"))
          productsBySku.put(variant.getSku(), product);
      }
    }

    for (ProductUpsertRequest request : demoProducts()) {
      Product product =
          request.variants().stream()
              .map(variant -> productsBySku.get(variant.sku()))
              .filter(java.util.Objects::nonNull)
              .findFirst()
              .orElse(null);
      if (product == null) {
        product = products.create(request);
      } else {
        product.update(
            request.name(),
            request.brand(),
            request.description(),
            request.imageUrl(),
            request.minimumStock(),
            true,
            new HashSet<>(
                categoryRepo.findByIdInAndDeletedAtIsNull(
                    request.categoryIds())));
        product.updateSlug(slugify(request.name()));
        for (ProductVariantRequest variantRequest : request.variants()) {
          ProductVariant variant =
              product.getVariants().stream()
                  .filter(
                      existing ->
                          existing.getSku().equals(variantRequest.sku()))
                  .findFirst()
                  .orElse(null);
          if (variant == null) {
            variant =
                new ProductVariant(
                    variantRequest.sku(),
                    variantRequest.label(),
                    variantRequest.color(),
                    variantRequest.size(),
                    variantRequest.priceCents(),
                    variantRequest.stockQuantity());
            product.addVariant(variant);
          } else {
            variant.update(
                variantRequest.label(),
                variantRequest.color(),
                variantRequest.size(),
                variantRequest.priceCents(),
                variantRequest.stockQuantity());
          }
          productsBySku.put(variantRequest.sku(), product);
        }
      }
      product.activate();
      product.updateImageUrl(request.imageUrl());
      for (ProductVariant variant : product.getVariants()) {
        if (variant.getSku().startsWith("DEMO-"))
          productsBySku.put(variant.getSku(), product);
      }
    }

    productsBySku.entrySet().stream()
        .filter(entry -> isRetiredBeltSku(entry.getKey()))
        .map(Map.Entry::getValue)
        .distinct()
        .forEach(Product::deactivate);

    var demoCoupons = couponRepo.findByCodeStartingWith("DEMO-");
    Set<String> existingCouponCodes = new HashSet<>();
    demoCoupons.forEach(coupon -> existingCouponCodes.add(coupon.getCode()));
    for (CouponUpsertRequest coupon : demoCoupons()) {
      if (existingCouponCodes.add(coupon.code())) coupons.create(coupon);
    }
    couponRepo
        .findByCodeStartingWith("DEMO-")
        .forEach(coupon -> coupon.activate());
    seedOrders();
    seedProductReviews();
    int activeProducts =
        (int) demoCatalogProducts().stream().filter(Product::isActive).count();
    return Map.of(
        "products",
        activeProducts,
        "coupons",
        couponRepo.findByCodeStartingWith("DEMO-").size(),
        "orders",
        (int) orders.count());
  }

  @Transactional(readOnly = true)
  public boolean isSeeded() {
    return demoCatalogProducts().stream().anyMatch(Product::isActive)
        || couponRepo.findByCodeStartingWith("DEMO-").stream()
            .anyMatch(coupon -> coupon.isActive());
  }

  @Transactional
  public void hide() {
    demoCatalogProducts().forEach(p -> products.deactivate(p.getId()));
    couponRepo
        .findByCodeStartingWith("DEMO-")
        .forEach(c -> coupons.deactivate(c.getId()));
  }

  private void seedOrders() {
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
              "Produto demonstrativo para acompanhamento de troca.");
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
                        "Cartão demonstrativo",
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

  private List<ProductUpsertRequest> demoProducts() {
    return List.of(
        product(
            "Bola Strike Pro",
            "DEMO-BAL-001",
            "Bola de futebol para partidas e treinos.",
            List.of(1L),
            14990,
            sizedVariants("DEMO-BAL-001", 14990, null, List.of("4", "5"), "5")),
        product(
            "Tênis Velocity Runner",
            "DEMO-RUN-001",
            "Tênis leve para treinos e corridas diárias.",
            List.of(2L),
            39990,
            sizedVariants(
                "DEMO-RUN-001",
                39990,
                "Preto",
                List.of("39", "40", "41", "42", "43", "44"),
                "41")),
        product(
            "Kit PowerBand",
            "DEMO-TRN-001",
            "Faixas em níveis de resistência para treino funcional.",
            List.of(3L),
            8990,
            choices("DEMO-TRN-001", 8990, List.of("Leve", "Média", "Forte"))),
        product(
            "Mochila Trail 18L",
            "DEMO-OUT-001",
            "Mochila compacta para trilhas e atividades ao ar livre.",
            List.of(4L),
            22990,
            colorVariants(
                "DEMO-OUT-001",
                22990,
                List.of("Verde", "Preto", "Azul"),
                "Verde")),
        product(
            "Chuteira Apex Field",
            "DEMO-FTB-002",
            "Chuteira de campo com ajuste confortável.",
            List.of(1L),
            25990,
            sizedVariants(
                "DEMO-FTB-002",
                25990,
                "Preto",
                List.of("38", "39", "40", "41", "42", "43"),
                "40")),
        catalogProduct(
            "Camisa Seleção Japonesa Titular",
            "Adidas",
            "Camisa azul da seleção japonesa de futebol, modelo titular.",
            List.of(1L),
            9990,
            "/products/jersey-japan-home.jpg",
            sizedVariants(
                "DEMO-FTB-003",
                9990,
                "Azul",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Garrafa Térmica 700 ml",
            "DEMO-TRN-002",
            "Garrafa térmica para manter a hidratação durante o treino.",
            List.of(3L, 4L),
            7990,
            colorVariants(
                "DEMO-TRN-002",
                7990,
                List.of("Verde", "Preto", "Azul"),
                "Verde")),
        product(
            "Tapete Flow",
            "DEMO-TRN-003",
            "Tapete antiderrapante para mobilidade e treino funcional.",
            List.of(3L),
            12990,
            choices(
                "DEMO-TRN-003",
                12990,
                List.of("Cinza 6 mm", "Azul 6 mm", "Verde 8 mm"))),
        product(
            "Relógio Pace",
            "DEMO-RUN-002",
            "Relógio esportivo para acompanhar tempo e ritmo.",
            List.of(2L),
            49990,
            colorVariants(
                "DEMO-RUN-002",
                49990,
                List.of("Preto", "Azul", "Verde"),
                "Preto")),
        product(
            "Meia Trail Performance",
            "DEMO-OUT-002",
            "Meia ventilada para corrida e trilhas.",
            List.of(2L, 4L),
            3990,
            sizedVariants(
                "DEMO-OUT-002",
                3990,
                "Preto",
                List.of("35–38", "39–42", "43–46"),
                "39–42")),
        product(
            "Lanterna Trail Beam",
            "DEMO-OUT-003",
            "Lanterna recarregável para aventuras em baixa luminosidade.",
            List.of(4L),
            15990,
            colorVariants(
                "DEMO-OUT-003", 15990, List.of("Verde", "Preto"), "Verde")),
        product(
            "Jaqueta Wind Shell",
            "DEMO-OUT-004",
            "Jaqueta leve corta-vento para corridas e atividades externas.",
            List.of(4L, 2L),
            21990,
            sizedVariants(
                "DEMO-OUT-004",
                21990,
                "Verde",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Judogi Essencial",
            "DEMO-MAR-001",
            "Kimono de judô para treinos frequentes no tatame.",
            List.of(5L),
            28990,
            matrixVariants(
                "DEMO-MAR-001",
                28990,
                List.of("Branco", "Azul"),
                List.of("A0", "A1", "A2", "A3", "A4"))),
        beltColorProduct(
            "Faixa Torah de Judô Verde",
            "DEMO-MAR-002",
            "Verde",
            "belt-judo-green.png",
            4990),
        catalogProduct(
            "Camisa Seleção Japonesa Reserva",
            "Adidas",
            "Camisa branca da seleção japonesa de futebol, modelo reserva.",
            List.of(1L),
            9990,
            "/products/jersey-japan-away.jpg",
            sizedVariants(
                "DEMO-CAMISA-M",
                9990,
                "Branco",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Tênis Road Sprint",
            "DEMO-TENIS-40",
            "Tênis de corrida leve para treinos diários.",
            List.of(2L),
            34990,
            sizedVariants(
                "DEMO-TENIS-40",
                34990,
                "Preto",
                List.of("39", "40", "41", "42", "43"),
                "40")),
        torahProduct(
            "Judô Trançado Plus Adulto",
            "DEMO-JDO-001",
            "Judogi Torah trançado para treinos adultos de judô.",
            58900,
            "DEMO-JDO-001",
            "Judogi Trançado Plus Torah",
            List.of("Branco", "Azul"),
            List.of("A0", "A1", "A2", "A3", "A4")),
        torahProduct(
            "Judô Trançado Plus Infantil",
            "DEMO-JDO-002",
            "Judogi Torah infantil para prática e treino de judô.",
            39900,
            "DEMO-JDO-002",
            "Judogi Plus Torah Infantil",
            List.of("Branco", "Azul"),
            List.of("M00", "M0", "M1", "M2", "M3", "M4")),
        torahProduct(
            "Judô Trançado Advanced Adulto",
            "DEMO-JDO-003",
            "Judogi Torah Trançado Advanced para judocas adultos.",
            69900,
            "DEMO-JDO-003",
            "Judogi Advanced Torah",
            List.of("Branco", "Azul"),
            List.of("A0", "A1", "A2", "A3", "A4")),
        torahProduct(
            "Judô Trançado Advanced Infantil",
            "DEMO-JDO-004",
            "Judogi Torah Trançado Advanced em tamanhos infantis.",
            48900,
            "DEMO-JDO-004",
            "Judogi Advanced Torah Infantil",
            List.of("Branco", "Azul"),
            List.of("M00", "M0", "M1", "M2", "M3", "M4")),
        torahProduct(
            "Kimono Judô Iniciante Adulto",
            "DEMO-JDO-005",
            "Kimono Torah para quem está começando no judô.",
            32900,
            "DEMO-JDO-005",
            "Kimono Iniciante Torah",
            List.of("Branco", "Azul"),
            List.of("A0", "A1", "A2", "A3", "A4", "A5")),
        torahProduct(
            "Kimono Judô Iniciante Infantil",
            "DEMO-JDO-006",
            "Kimono Torah para os primeiros treinos infantis de judô.",
            27900,
            "DEMO-JDO-006",
            "Kimono Iniciante Torah Infantil",
            List.of("Branco", "Azul"),
            List.of("M00", "M0", "M1", "M2", "M3", "M4")),
        beltColorProduct(
            "Faixa Torah de Judô Branca",
            "DEMO-BELT-WHITE",
            "Branco",
            "belt-judo-white.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Cinza",
            "DEMO-BELT-GRAY",
            "Cinza",
            "belt-judo-gray.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Amarela",
            "DEMO-BELT-YELLOW",
            "Amarelo",
            "belt-judo-yellow.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Laranja",
            "DEMO-BELT-ORANGE",
            "Laranja",
            "belt-judo-orange.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Azul Royal",
            "DEMO-BELT-ROYAL-BLUE",
            "Azul Royal",
            "belt-judo-blue.png",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Azul Celeste",
            "DEMO-BELT-LIGHT-BLUE",
            "Azul Celeste",
            "belt-judo-light-blue.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Roxa",
            "DEMO-BELT-PURPLE",
            "Roxo",
            "belt-judo-purple.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Marrom",
            "DEMO-BELT-BROWN",
            "Marrom",
            "belt-judo-brown.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Vermelha",
            "DEMO-BELT-RED",
            "Vermelho",
            "belt-judo-red.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Preta",
            "DEMO-BELT-BLACK",
            "Preto",
            "belt-judo-black.jpg",
            4990),
        catalogProduct(
            "Bolsa Torah",
            "Torah",
            "Bolsa esportiva Torah para transportar kimono e acessórios.",
            List.of(5L),
            14900,
            "/products/torah-bag.png",
            colorVariants(
                "DEMO-JDO-011", 14900, List.of("Azul", "Preto"), "Azul")),
        catalogProduct(
            "Mochila Torah",
            "Torah",
            "Mochila Torah para levar equipamentos aos treinos.",
            List.of(5L),
            16900,
            "/products/torah-backpack.webp",
            choices("DEMO-JDO-012", 16900, List.of("Compacta", "Grande"))),
        catalogProduct(
            "Sacola Torah",
            "Torah",
            "Sacola Torah prática para transportar roupas de treino.",
            List.of(5L),
            8900,
            "/products/torah-sacola.jpg",
            colorVariants(
                "DEMO-JDO-013", 8900, List.of("Azul", "Branca"), "Azul")),
        product(
            "Joelheira de Treino",
            "DEMO-TRN-004",
            "Par de joelheiras para exercícios e treino funcional.",
            List.of(3L, 5L),
            7990,
            sizedVariants(
                "DEMO-TRN-004", 7990, "Preto", List.of("P", "M", "G"), "M")),
        product(
            "Corda de Pular Speed",
            "DEMO-TRN-005",
            "Corda ajustável para aquecimento e condicionamento físico.",
            List.of(3L),
            5990,
            colorVariants(
                "DEMO-TRN-005",
                5990,
                List.of("Preto", "Vermelho", "Azul"),
                "Preto")),
        product(
            "Luvas de Academia Grip",
            "DEMO-TRN-006",
            "Luvas com palma aderente para exercícios com pesos.",
            List.of(3L),
            6990,
            sizedVariants(
                "DEMO-TRN-006",
                6990,
                "Preto",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Bola de Vôlei Arena",
            "DEMO-VOL-001",
            "Bola de vôlei para partidas recreativas e treinos.",
            List.of(3L),
            12990,
            sizedVariants("DEMO-VOL-001", 12990, null, List.of("4", "5"), "5")),
        product(
            "Caneleira Shield",
            "DEMO-FTB-004",
            "Caneleira leve para proteção durante partidas de futebol.",
            List.of(1L),
            4990,
            sizedVariants(
                "DEMO-FTB-004",
                4990,
                "Preto e laranja",
                List.of("P", "M", "G"),
                "M")),
        product(
            "Luva de Goleiro Block",
            "DEMO-FTB-005",
            "Luva de goleiro para treinos e jogos de futebol.",
            List.of(1L),
            11990,
            sizedVariants(
                "DEMO-FTB-005",
                11990,
                "Verde",
                List.of("8", "9", "10", "11"),
                "9")),
        product(
            "Shorts Run Pace",
            "DEMO-RUN-004",
            "Shorts leve para corrida e treino ao ar livre.",
            List.of(2L),
            8990,
            sizedVariants(
                "DEMO-RUN-004",
                8990,
                "Preto",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Cinto de Hidratação Trail",
            "DEMO-OUT-005",
            "Cinto compacto para levar água e itens essenciais em corridas.",
            List.of(4L, 2L),
            9990,
            List.of(
                variant(
                    "DEMO-OUT-005", "Tamanho único", "Preto", null, 9990, 20))),
        product(
            "Boné Outdoor UV",
            "DEMO-OUT-006",
            "Boné leve para atividades esportivas ao ar livre.",
            List.of(4L),
            6990,
            colorVariants(
                "DEMO-OUT-006",
                6990,
                List.of("Preto", "Azul", "Verde"),
                "Preto")),
        product(
            "Faixa Elástica de Alongamento",
            "DEMO-TRN-007",
            "Faixa longa para alongamento, mobilidade e fisioterapia.",
            List.of(3L),
            2990,
            choices("DEMO-TRN-007", 2990, List.of("Leve", "Média", "Forte"))),
        product(
            "Meião Futebol Match",
            "DEMO-FTB-006",
            "Meião de cano alto para treinos e partidas de futebol.",
            List.of(1L),
            3990,
            sizedVariants(
                "DEMO-FTB-006",
                3990,
                "Branco",
                List.of("35–38", "39–42", "43–46"),
                "39–42")));
  }

  private void seedProductReviews() {
    String[] ratings = {"4.5", "5.0", "4.0", "4.5", "3.5"};
    for (Product product : demoCatalogProducts()) {
      if (!product.isActive()) continue;
      List<ProductReview> existingReviews =
          productReviews.findByProductIdOrderByCreatedAtDesc(product.getId());
      List<String> descriptions = reviewDescriptions(product.getName());
      for (int index = existingReviews.size(); index < 5; index++) {
        BigDecimal rating =
            new BigDecimal(
                ratings[
                    (index
                            + Math.floorMod(
                                product.getId().intValue(), ratings.length))
                        % ratings.length]);
        product.registerReview(rating);
        productReviews.save(
            new ProductReview(
                product,
                null,
                null,
                rating,
                descriptions.get(index % descriptions.size())));
      }
    }
  }

  private List<String> reviewDescriptions(String name) {
    if (name.startsWith("Faixa Torah de Judô"))
      return List.of(
          "A cor e o tamanho correspondem ao que eu procurava.",
          "A costura parece firme e a faixa amarra bem.",
          "Bom acabamento para usar nos treinos da semana.",
          "O tecido é resistente e confortável no tatame.",
          "Gostei da qualidade e do caimento depois de amarrada.");
    if (name.contains("Judô")
        || name.contains("Judogi")
        || name.contains("Kimono"))
      return List.of(
          "O kimono veste bem e oferece boa mobilidade no treino.",
          "O tecido parece resistente para treinar com frequência.",
          "Gostei do acabamento e do conforto durante a aula.",
          "O tamanho ficou adequado e permite movimentar os braços.",
          "Boa construção para a rotina no tatame.");
    if (name.contains("Camisa Seleção Japonesa"))
      return List.of(
          "Tecido leve e confortável para jogar e torcer.",
          "Gostei do caimento e das cores da camisa.",
          "Boa ventilação para usar durante a partida.",
          "O material é agradável e seca rápido.",
          "A estampa ficou bonita e o tamanho correspondeu.");
    if (name.startsWith("Tênis"))
      return List.of(
          "O ajuste ficou confortável nos treinos de corrida.",
          "Leve no pé e com boa sensação de amortecimento.",
          "Usei em vários treinos e gostei da estabilidade.",
          "O tamanho correspondeu e o acabamento é caprichado.",
          "Boa opção para corridas e caminhadas do dia a dia.");
    return List.of(
        "O produto correspondeu às informações e chegou em bom estado.",
        "Boa qualidade e acabamento para usar na rotina de treino.",
        "Gostei da praticidade e do conforto durante o uso.",
        "Atendeu bem ao que eu precisava para as atividades esportivas.",
        "Material resistente e fácil de usar nos treinos.");
  }

  private List<CouponUpsertRequest> demoCoupons() {
    LocalDateTime now = LocalDateTime.now();
    return List.of(
        new CouponUpsertRequest(
            "DEMO-10",
            "10% de desconto demonstrativo",
            CouponDiscountType.PERCENTAGE,
            null,
            new BigDecimal("10"),
            3000L,
            10000L,
            now.minusMinutes(1),
            now.plusMonths(3),
            100,
            true),
        new CouponUpsertRequest(
            "DEMO-20",
            "20% de desconto em pedidos acima de R$ 250",
            CouponDiscountType.PERCENTAGE,
            null,
            new BigDecimal("20"),
            6000L,
            25000L,
            now.minusMinutes(1),
            now.plusMonths(2),
            50,
            true),
        new CouponUpsertRequest(
            "DEMO-FRETE",
            "Frete demonstrativo de R$ 15",
            CouponDiscountType.FIXED_AMOUNT,
            1500L,
            null,
            null,
            12000L,
            now.minusMinutes(1),
            now.plusMonths(1),
            100,
            true));
  }

  private ProductUpsertRequest product(
      String name,
      String sku,
      String description,
      List<Long> categoryIds,
      long price,
      List<ProductVariantRequest> variants) {
    return catalogProduct(
        name,
        "coHida",
        description,
        categoryIds,
        price,
        imageUrlForSku(sku),
        variants);
  }

  private ProductUpsertRequest catalogProduct(
      String name,
      String brand,
      String description,
      List<Long> categoryIds,
      long price,
      String imageUrl,
      List<ProductVariantRequest> variants) {
    return new ProductUpsertRequest(
        name, brand, description, imageUrl, categoryIds, 1, true, variants);
  }

  private ProductVariantRequest variant(
      String sku,
      String label,
      String color,
      String size,
      long price,
      int stock) {
    return new ProductVariantRequest(sku, label, color, size, price, stock);
  }

  private List<ProductVariantRequest> sizedVariants(
      String baseSku,
      long price,
      String color,
      List<String> sizes,
      String defaultSize) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (String size : sizes) {
      String sku =
          size.equals(defaultSize) ? baseSku : baseSku + "-" + skuToken(size);
      result.add(variant(sku, "Tamanho " + size, color, size, price, 12));
    }
    return result;
  }

  private List<ProductVariantRequest> colorVariants(
      String baseSku, long price, List<String> colors, String defaultColor) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (String color : colors) {
      String sku =
          color.equals(defaultColor)
              ? baseSku
              : baseSku + "-" + skuToken(color);
      result.add(variant(sku, color, color, null, price, 12));
    }
    return result;
  }

  private List<ProductVariantRequest> choices(
      String baseSku, long price, List<String> labels) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (int index = 0; index < labels.size(); index++) {
      String label = labels.get(index);
      String sku = index == 0 ? baseSku : baseSku + "-" + skuToken(label);
      result.add(variant(sku, label, null, label, price, 12));
    }
    return result;
  }

  private List<ProductVariantRequest> matrixVariants(
      String baseSku, long price, List<String> colors, List<String> sizes) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (String color : colors) {
      for (String size : sizes) {
        String sku =
            color.equals(colors.getFirst()) && size.equals("A2")
                ? baseSku
                : baseSku + "-" + skuToken(color) + "-" + skuToken(size);
        result.add(variant(sku, color + " / " + size, color, size, price, 12));
      }
    }
    return result;
  }

  private ProductUpsertRequest beltColorProduct(
      String name, String baseSku, String color, String image, long price) {
    return catalogProduct(
        name,
        "Torah",
        "Faixa de judô Torah na cor " + color + " para treinos e graduação.",
        List.of(5L),
        price,
        "/products/" + image,
        sizedVariants(
            baseSku,
            price,
            color,
            List.of("A2", "A0", "A1", "A3", "A4"),
            "A2"));
  }

  private ProductUpsertRequest torahProduct(
      String name,
      String skuPrefix,
      String description,
      long price,
      String sku,
      String labelPrefix,
      List<String> colors,
      List<String> sizes) {
    List<ProductVariantRequest> options = new ArrayList<>();
    for (String color : colors) {
      for (String size : sizes) {
        String colorCode =
            color
                .toUpperCase(java.util.Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "");
        String sizeCode =
            size.toUpperCase(java.util.Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        String variantSku =
            color.equals(colors.getFirst()) && size.equals(sizes.getFirst())
                ? skuPrefix
                : skuPrefix + "-" + colorCode + "-" + sizeCode;
        options.add(
            new ProductVariantRequest(
                variantSku,
                labelPrefix + " " + color + " / " + size,
                color,
                size,
                price,
                8));
      }
    }
    return new ProductUpsertRequest(
        name,
        "Torah",
        description,
        imageUrlForSku(sku),
        List.of(5L),
        1,
        true,
        options);
  }

  private List<Product> demoCatalogProducts() {
    return productRepo.findAllByOrderByNameAsc().stream()
        .filter(
            product ->
                product.getVariants().stream()
                    .anyMatch(variant -> variant.getSku().startsWith("DEMO-")))
        .toList();
  }

  private String cleanProductName(String name) {
    return name.startsWith("DEMO - ")
        ? name.substring("DEMO - ".length())
        : name;
  }

  private boolean isRetiredBeltSku(String sku) {
    return sku.startsWith("DEMO-JDO-007")
        || sku.startsWith("DEMO-JDO-008")
        || sku.startsWith("DEMO-JDO-009")
        || sku.startsWith("DEMO-JDO-010");
  }

  private String slugify(String value) {
    return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase(java.util.Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-|-$)", "");
  }

  private String skuToken(String value) {
    return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toUpperCase(java.util.Locale.ROOT)
        .replaceAll("[^A-Z0-9]+", "");
  }

  private String imageUrlForSku(String sku) {
    if (sku.startsWith("DEMO-JDO-001")) return "/products/torah-judo-plus.jpg";
    if (sku.startsWith("DEMO-JDO-002"))
      return "/products/torah-judo-plus-infantil.jpg";
    if (sku.startsWith("DEMO-JDO-003"))
      return "/products/torah-judo-advanced-white.png";
    if (sku.startsWith("DEMO-JDO-004"))
      return "/products/torah-judo-plus-infantil.jpg";
    if (sku.startsWith("DEMO-JDO-005"))
      return "/products/torah-judo-beginner.jpg";
    if (sku.startsWith("DEMO-JDO-006"))
      return "/products/torah-judo-infant-beginner.png";
    if (sku.startsWith("DEMO-BELT-WHITE"))
      return "/products/belt-judo-white.jpg";
    if (sku.startsWith("DEMO-BELT-GRAY")) return "/products/belt-judo-gray.jpg";
    if (sku.startsWith("DEMO-BELT-YELLOW"))
      return "/products/belt-judo-yellow.jpg";
    if (sku.startsWith("DEMO-BELT-ORANGE"))
      return "/products/belt-judo-orange.jpg";
    if (sku.startsWith("DEMO-BELT-ROYAL-BLUE"))
      return "/products/belt-judo-blue.png";
    if (sku.startsWith("DEMO-BELT-LIGHT-BLUE"))
      return "/products/belt-judo-light-blue.jpg";
    if (sku.startsWith("DEMO-BELT-PURPLE"))
      return "/products/belt-judo-purple.jpg";
    if (sku.startsWith("DEMO-BELT-BROWN"))
      return "/products/belt-judo-brown.jpg";
    if (sku.startsWith("DEMO-BELT-RED")) return "/products/belt-judo-red.jpg";
    if (sku.startsWith("DEMO-BELT-BLACK"))
      return "/products/belt-judo-black.jpg";
    String filename = switch (sku) {
      case "DEMO-CAMISA-M" -> "jersey-japan-away.jpg";
      case "DEMO-TENIS-40" -> "tenis-road-sprint.png";
      case "DEMO-BAL-001" -> "bola-strike-pro.png";
      case "DEMO-RUN-001" -> "tenis-velocity-runner.png";
      case "DEMO-TRN-001" -> "kit-powerband.png";
      case "DEMO-OUT-001" -> "mochila-trail-18l.png";
      case "DEMO-FTB-002" -> "chuteira-apex-field.png";
      case "DEMO-FTB-003" -> "jersey-japan-home.jpg";
      case "DEMO-TRN-002" -> "garrafa-termica-700ml.png";
      case "DEMO-TRN-003" -> "tapete-flow.png";
      case "DEMO-RUN-002" -> "relogio-pace.png";
      case "DEMO-OUT-002" -> "meia-trail-performance.png";
      case "DEMO-OUT-003" -> "lanterna-trail-beam.png";
      case "DEMO-OUT-004" -> "jaqueta-wind-shell.png";
      case "DEMO-MAR-001" -> "judogi-essencial.png";
      case "DEMO-MAR-002" -> "belt-judo-green.png";
      case "DEMO-JDO-001" -> "torah-judo-plus.jpg";
      case "DEMO-JDO-002", "DEMO-JDO-004" -> "torah-judo-plus-infantil.jpg";
      case "DEMO-JDO-003" -> "torah-judo-advanced-white.png";
      case "DEMO-JDO-005" -> "torah-judo-beginner.jpg";
      case "DEMO-JDO-006" -> "torah-judo-infant-beginner.png";
      case "DEMO-JDO-007", "DEMO-JDO-008", "DEMO-JDO-009", "DEMO-JDO-010" ->
              "torah-belt-white.jpg";
      case "DEMO-JDO-011" -> "torah-bag.png";
      case "DEMO-JDO-012" -> "torah-backpack.webp";
      case "DEMO-JDO-013" -> "torah-sacola.jpg";
      case "DEMO-TRN-004" -> "demo-knee-sleeve.jpg";
      case "DEMO-TRN-005" -> "demo-jump-rope.jpg";
      case "DEMO-TRN-006" -> "demo-gym-gloves.jpg";
      case "DEMO-VOL-001" -> "demo-volleyball.jpg";
      case "DEMO-FTB-004" -> "demo-shin-guards.jpg";
      case "DEMO-FTB-005" -> "demo-goalie-gloves.jpg";
      case "DEMO-RUN-004" -> "demo-running-shorts.jpg";
      case "DEMO-OUT-005" -> "demo-hydration-belt-clean.jpg";
      case "DEMO-OUT-006" -> "demo-running-cap.jpg";
      case "DEMO-TRN-007" -> "stretch-band.jpg";
      case "DEMO-FTB-006" -> "demo-football-socks.jpg";
      default -> null;
    };
    return filename == null ? null : "/products/" + filename;
  }
}
