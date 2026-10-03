package com.hida.cohida.demo;

import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.coupon.service.CouponService;
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class DemoSeederService {
    private final ProductService products;
    private final ProductRepository productRepo;
    private final CouponService coupons;
    private final CouponRepository couponRepo;

    public DemoSeederService(ProductService p, ProductRepository pr, CouponService c, CouponRepository cr) {
        products = p;
        productRepo = pr;
        coupons = c;
        couponRepo = cr;
    }

    @Transactional
    public Map<String, Integer> seed() {
        if (productRepo.findByNameStartingWith("DEMO - ").isEmpty()) {
            products.create(product("DEMO - Camisa Futebol", "DEMO-CAMISA-M", 12990));
            products.create(product("DEMO - Tênis Corrida", "DEMO-TENIS-40", 24990));
        }
        if (couponRepo.findByCodeStartingWith("DEMO-").isEmpty())
            coupons.create(new CouponUpsertRequest("DEMO-10", "10% de desconto demonstrativo", CouponDiscountType.PERCENTAGE, null, new BigDecimal("10"), 3000L, 10000L, LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusMonths(3), 100, true));
        return Map.of("products", productRepo.findByNameStartingWith("DEMO - ").size(), "coupons", couponRepo.findByCodeStartingWith("DEMO-").size());
    }

    @Transactional
    public void hide() {
        productRepo.findByNameStartingWith("DEMO - ").forEach(p -> products.deactivate(p.getId()));
        couponRepo.findByCodeStartingWith("DEMO-").forEach(c -> coupons.deactivate(c.getId()));
    }

    private ProductUpsertRequest product(String n, String sku, long price) {
        return new ProductUpsertRequest(n, "Cohida", "Produto de demonstração", List.of("Demo"), 1, true, List.of(new ProductVariantRequest(sku, "Padrão", "Azul", "M", price, 20)));
    }
}
