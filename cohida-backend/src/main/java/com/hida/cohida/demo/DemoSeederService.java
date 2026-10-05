package com.hida.cohida.demo;

import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.coupon.service.CouponService;
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
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.repository.ProductVariantRepository;
import com.hida.cohida.product.service.ProductService;
import com.hida.cohida.returnrequest.domain.ReturnStatus;
import com.hida.cohida.returnrequest.service.ReturnService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DemoSeederService {
    private final ProductService products;
    private final ProductRepository productRepo;
    private final CouponService coupons;
    private final CouponRepository couponRepo;
    private final AccountRepository accounts;
    private final AuthService auth;
    private final PaymentCardService cards;
    private final OrderRepository orders;
    private final ProductVariantRepository variants;
    private final ReturnService returns;

    public DemoSeederService(ProductService p, ProductRepository pr, CouponService c, CouponRepository cr,
                             AccountRepository a, AuthService as, PaymentCardService pcs, OrderRepository or,
                             ProductVariantRepository vr, ReturnService rs) {
        products = p;
        productRepo = pr;
        coupons = c;
        couponRepo = cr;
        accounts = a;
        auth = as;
        cards = pcs;
        orders = or;
        variants = vr;
        returns = rs;
    }

    @Transactional
    public Map<String, Integer> seed() {
        var demoProducts = productRepo.findByNameStartingWith("DEMO - ");
        Set<String> existingProductNames = new HashSet<>();
        demoProducts.forEach(product -> existingProductNames.add(product.getName()));
        for (ProductUpsertRequest product : demoProducts()) {
            if (existingProductNames.add(product.name())) products.create(product);
        }
        productRepo.findByNameStartingWith("DEMO - ").forEach(product -> {
            product.activate();
            String imageUrl = imageUrlForSku(product.getVariants().getFirst().getSku());
            if (imageUrl != null) product.updateImageUrl(imageUrl);
        });

        var demoCoupons = couponRepo.findByCodeStartingWith("DEMO-");
        Set<String> existingCouponCodes = new HashSet<>();
        demoCoupons.forEach(coupon -> existingCouponCodes.add(coupon.getCode()));
        for (CouponUpsertRequest coupon : demoCoupons()) {
            if (existingCouponCodes.add(coupon.code())) coupons.create(coupon);
        }
        couponRepo.findByCodeStartingWith("DEMO-").forEach(coupon -> coupon.activate());
        seedOrders();
        return Map.of("products", productRepo.findByNameStartingWith("DEMO - ").size(), "coupons", couponRepo.findByCodeStartingWith("DEMO-").size(), "orders", (int) orders.count());
    }

    @Transactional(readOnly = true)
    public boolean isSeeded() {
        return productRepo.findByNameStartingWith("DEMO - ").stream().anyMatch(product -> product.isActive())
                || couponRepo.findByCodeStartingWith("DEMO-").stream().anyMatch(coupon -> coupon.isActive());
    }

    @Transactional
    public void hide() {
        productRepo.findByNameStartingWith("DEMO - ").forEach(p -> products.deactivate(p.getId()));
        couponRepo.findByCodeStartingWith("DEMO-").forEach(c -> coupons.deactivate(c.getId()));
    }

    private void seedOrders() {
        Customer ana = customer("Ana Costa", "ana.demo@cohida.test", "52998224725", "11990000001");
        Customer bruno = customer("Bruno Lima", "bruno.demo@cohida.test", "11144477735", "11990000002");
        Customer clara = customer("Clara Souza", "clara.demo@cohida.test", "93541134780", "11990000003");

        PaymentCard anaCard = card(ana, "4111111111111111");
        PaymentCard brunoCard = card(bruno, "5555555555554444");
        PaymentCard claraCard = card(clara, "378282246310005");

        LocalDateTime now = LocalDateTime.now();
        List<DemoOrder> samples = List.of(
                new DemoOrder(ana, anaCard, "DEMO-BAL-001", 2, OrderStatus.EM_PROCESSAMENTO),
                new DemoOrder(bruno, brunoCard, "DEMO-RUN-001", 1, OrderStatus.PAGAMENTO_REALIZADO),
                new DemoOrder(clara, claraCard, "DEMO-TRN-001", 3, OrderStatus.EM_TRANSITO),
                new DemoOrder(ana, anaCard, "DEMO-OUT-001", 1, OrderStatus.ENTREGUE),
                new DemoOrder(bruno, brunoCard, "DEMO-FTB-002", 1, OrderStatus.ENTREGUE),
                new DemoOrder(clara, claraCard, "DEMO-RUN-002", 1, OrderStatus.PAGAMENTO_REALIZADO),
                new DemoOrder(ana, anaCard, "DEMO-TRN-002", 2, OrderStatus.EM_TRANSITO),
                new DemoOrder(bruno, brunoCard, "DEMO-MAR-001", 1, OrderStatus.EM_PROCESSAMENTO),
                new DemoOrder(clara, claraCard, "DEMO-OUT-003", 1, OrderStatus.ENTREGUE),
                new DemoOrder(ana, anaCard, "DEMO-MAR-002", 2, OrderStatus.PAGAMENTO_REALIZADO),
                new DemoOrder(bruno, brunoCard, "DEMO-OUT-004", 1, OrderStatus.EM_TRANSITO),
                new DemoOrder(clara, claraCard, "DEMO-FTB-003", 1, OrderStatus.EM_PROCESSAMENTO)
        );
        int existingOrders = List.of(ana, bruno, clara).stream()
                .mapToInt(customer -> orders.findByCustomerIdOrderByCreatedAtDesc(customer.getId()).size())
                .sum();
        SaleOrder delivered = null;
        for (int index = existingOrders; index < samples.size(); index++) {
            DemoOrder sample = samples.get(index);
            SaleOrder saved = order(sample.customer(), sample.card(), sample.sku(), sample.quantity(), sample.status(), now);
            if (existingOrders == 0 && sample.status() == OrderStatus.ENTREGUE && delivered == null) delivered = saved;
        }

        redistributeDemoOrderDates(now, ana, bruno, clara);

        if (delivered != null) {
            var request = returns.request(ana.getId(), delivered.getId(), delivered.getItems().getFirst().getId(),
                    "Produto demonstrativo para acompanhamento de troca.");
            returns.status(request.getId(), ReturnStatus.ACEITA);
            returns.dispatch(ana.getId(), request.getId(), "DEMO-RET-001");
            returns.status(request.getId(), ReturnStatus.ITEM_RECEBIDO);
        }
    }

    private void redistributeDemoOrderDates(LocalDateTime now, Customer... customers) {
        List<SaleOrder> demoOrders = java.util.Arrays.stream(customers)
                .flatMap(customer -> orders.findByCustomerIdOrderByCreatedAtDesc(customer.getId()).stream())
                .toList();
        LocalDateTime firstSale = now.minusMonths(5).withDayOfMonth(10);
        for (int index = 0; index < demoOrders.size(); index++) {
            orders.updateCreatedAt(demoOrders.get(index).getId(), firstSale.plusDays((index % 12) * 14L));
        }
    }

    private record DemoOrder(Customer customer, PaymentCard card, String sku, int quantity, OrderStatus status) {
    }

    private Customer customer(String name, String email, String cpf, String phone) {
        return accounts.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .map(account -> account.getCustomer())
                .orElseGet(() -> auth.createCustomer(new RegisterRequest(
                        name, java.time.LocalDate.of(1992, 6, 15), cpf, phone, email,
                        "Demo@123", "Demo@123", address("Cobrança"), address("Entrega")
                )));
    }

    private static AddressRequest address(String label) {
        return new AddressRequest(label, "Rua do Esporte", "100", "Centro", "01001000", "São Paulo", "SP", "Brasil");
    }

    private PaymentCard card(Customer customer, String number) {
        return cards.findAll(customer.getId()).stream().findFirst().orElseGet(() ->
                cards.create(customer.getId(), new PaymentCardCreateRequest(
                        "demo-card-" + customer.getId(), number, "Cartão demonstrativo", 12, 2030)));
    }

    private SaleOrder order(Customer customer, PaymentCard card, String sku, int quantity, OrderStatus target,
                            LocalDateTime createdAt) {
        var variant = variants.findAll().stream()
                .filter(candidate -> candidate.getSku().equals(sku))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Produto demonstrativo não encontrado: " + sku));
        var address = customer.getAddresses().stream()
                .filter(candidate -> candidate.getType() == AddressType.DELIVERY)
                .findFirst()
                .orElseThrow();
        long subtotal = variant.getPriceCents() * quantity;
        SaleOrder order = new SaleOrder(customer, subtotal, 0, 0, null, card.getBrand(), card.getLastDigits(),
                address.getLabel(), address.getStreet(), address.getNumber(), address.getNeighborhood(),
                address.getZipCode(), address.getCity(), address.getState(), address.getCountry());
        order.addPayment(card, subtotal);
        order.addItem(new OrderItem(variant.getId(), variant.getProduct().getName(), variant.getSku(),
                variant.getLabel(), variant.getPriceCents(), quantity));
        while (order.getStatus().ordinal() < target.ordinal()) order.changeStatus(OrderStatus.values()[order.getStatus().ordinal() + 1]);
        SaleOrder saved = orders.save(order);
        orders.updateCreatedAt(saved.getId(), createdAt);
        return saved;
    }

    private List<ProductUpsertRequest> demoProducts() {
        return List.of(
                product("Bola Strike Pro", "DEMO-BAL-001", "Bola de futebol com construção resistente para partidas intensas.", List.of("football"), 14990),
                product("Tênis Velocity Runner", "DEMO-RUN-001", "Tênis leve com amortecimento responsivo para treinos e corridas diárias.", List.of("running"), 39990),
                product("Kit PowerBand", "DEMO-TRN-001", "Três faixas de resistência para ativação, mobilidade e treino funcional.", List.of("training"), 8990),
                product("Mochila Trail 18L", "DEMO-OUT-001", "Mochila compacta para trilhas curtas, com bolsos de acesso rápido.", List.of("outdoor"), 22990),
                product("Chuteira Apex Field", "DEMO-FTB-002", "Chuteira de campo com trava firme e ajuste confortável.", List.of("football"), 25990),
                product("Camiseta Match Training", "DEMO-FTB-003", "Camiseta leve para treinos, jogos e atividades ao ar livre.", List.of("football", "training"), 9990),
                product("Garrafa Térmica 700 ml", "DEMO-TRN-002", "Garrafa térmica para manter a hidratação durante todo o treino.", List.of("training", "outdoor"), 7990),
                product("Tapete Flow", "DEMO-TRN-003", "Tapete antiderrapante para mobilidade, yoga e recuperação.", List.of("training"), 12990),
                product("Relógio Pace", "DEMO-RUN-002", "Relógio esportivo para acompanhar tempo, ritmo e evolução.", List.of("running"), 49990),
                product("Meia Trail Performance", "DEMO-OUT-002", "Meia de cano médio com ventilação para treinos longos.", List.of("running", "outdoor"), 3990),
                product("Lanterna Trail Beam", "DEMO-OUT-003", "Lanterna compacta para aventuras e treinos em baixa luminosidade.", List.of("outdoor"), 15990),
                product("Jaqueta Wind Shell", "DEMO-OUT-004", "Jaqueta leve corta-vento para corridas e atividades externas.", List.of("outdoor", "running"), 21990),
                product("Judogi Essencial", "DEMO-MAR-001", "Kimono de judô resistente para treinos frequentes no tatame.", List.of("martial-arts"), 28990),
                product("Faixa de Judô Verde", "DEMO-MAR-002", "Faixa reforçada para acompanhar cada etapa da sua graduação.", List.of("martial-arts"), 4990)
        );
    }

    private List<CouponUpsertRequest> demoCoupons() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                new CouponUpsertRequest("DEMO-10", "10% de desconto demonstrativo", CouponDiscountType.PERCENTAGE, null, new BigDecimal("10"), 3000L, 10000L, now.minusMinutes(1), now.plusMonths(3), 100, true),
                new CouponUpsertRequest("DEMO-20", "20% de desconto em pedidos acima de R$ 250", CouponDiscountType.PERCENTAGE, null, new BigDecimal("20"), 6000L, 25000L, now.minusMinutes(1), now.plusMonths(2), 50, true),
                new CouponUpsertRequest("DEMO-FRETE", "Frete demonstrativo de R$ 15", CouponDiscountType.FIXED_AMOUNT, 1500L, null, null, 12000L, now.minusMinutes(1), now.plusMonths(1), 100, true)
        );
    }

    private ProductUpsertRequest product(String name, String sku, String description, List<String> categories, long price) {
        return new ProductUpsertRequest("DEMO - " + name, "coHida", description, imageUrlForSku(sku), categories, 1, true,
                List.of(new ProductVariantRequest(sku, "Padrão", null, null, price, 20)));
    }

    private String imageUrlForSku(String sku) {
        return "/products/" + switch (sku) {
            case "DEMO-CAMISA-M" -> "camiseta-match-training.png";
            case "DEMO-BAL-001" -> "bola-strike-pro.png";
            case "DEMO-RUN-001" -> "tenis-velocity-runner.png";
            case "DEMO-TRN-001" -> "kit-powerband.png";
            case "DEMO-OUT-001" -> "mochila-trail-18l.png";
            case "DEMO-FTB-002" -> "chuteira-apex-field.png";
            case "DEMO-FTB-003" -> "camiseta-match-training.png";
            case "DEMO-TRN-002" -> "garrafa-termica-700ml.png";
            case "DEMO-TRN-003" -> "tapete-flow.png";
            case "DEMO-RUN-002" -> "relogio-pace.png";
            case "DEMO-OUT-002" -> "meia-trail-performance.png";
            case "DEMO-OUT-003" -> "lanterna-trail-beam.png";
            case "DEMO-OUT-004" -> "jaqueta-wind-shell.png";
            case "DEMO-MAR-001" -> "judogi-essencial.png";
            case "DEMO-MAR-002" -> "faixa-judo-verde.png";
            default -> null;
        };
    }
}
