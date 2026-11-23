package com.hida.cohida.demo;

import com.hida.cohida.category.repository.CategoryRepository;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.coupon.service.CouponService;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.domain.ProductReview;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.repository.ProductReviewRepository;
import com.hida.cohida.product.service.ProductService;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoSeederService {
  private final ProductService products;
  private final CategoryRepository categoryRepo;
  private final ProductRepository productRepo;
  private final CouponService coupons;
  private final CouponRepository couponRepo;
  private final OrderRepository orders;
  private final ProductReviewRepository productReviews;
  private final DemoOrderSeeder orderSeeder;

  public DemoSeederService(
      ProductService p,
      ProductRepository pr,
      CategoryRepository categoryRepo,
      CouponService c,
      CouponRepository cr,
      OrderRepository or,
      DemoOrderSeeder orderSeeder,
      ProductReviewRepository productReviews) {
    products = p;
    productRepo = pr;
    this.categoryRepo = categoryRepo;
    coupons = c;
    couponRepo = cr;
    orders = or;
    this.orderSeeder = orderSeeder;
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

    for (ProductUpsertRequest request : new DemoCatalogFixtures().products()) {
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
    for (CouponUpsertRequest coupon : DemoCouponFixtures.coupons()) {
      if (existingCouponCodes.add(coupon.code())) coupons.create(coupon);
    }
    couponRepo
        .findByCodeStartingWith("DEMO-")
        .forEach(coupon -> coupon.activate());
    orderSeeder.seed();
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

  private void seedProductReviews() {
    String[] ratings = {"4.5", "5.0", "4.0", "4.5", "3.5"};
    for (Product product : demoCatalogProducts()) {
      if (!product.isActive()) continue;
      List<ProductReview> existingReviews =
          productReviews.findByProductIdOrderByCreatedAtDesc(product.getId());
      List<String> descriptions =
          DemoReviewFixtures.descriptions(product.getName());
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

}
