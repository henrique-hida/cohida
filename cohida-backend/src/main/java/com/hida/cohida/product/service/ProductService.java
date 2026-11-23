package com.hida.cohida.product.service;

import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.repository.CategoryRepository;
import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import com.hida.cohida.product.exception.ProductNotFoundException;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.repository.ProductSearch;
import com.hida.cohida.product.dto.ProductPageResponse;
import com.hida.cohida.product.dto.ProductResponse;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;

@Service
public class ProductService {
  private final ProductRepository products;
  private final ProductVariantRepository variants;
  private final ProductSearch search;
  private final CategoryRepository categories;

  public ProductService(
      ProductRepository products,
      ProductVariantRepository variants,
      CategoryRepository categories, ProductSearch search) {
    this.products = products;
    this.variants = variants;
    this.search = search;
    this.categories = categories;
  }

  @Transactional(readOnly = true)
  public List<Product> findPublic(String search, Long categoryId) {
    String normalizedSearch = normalize(search);
    return products.findByActiveTrueOrderByNameAsc().stream()
        .filter(
            product ->
                normalizedSearch.isEmpty()
                    || containsSearch(product, normalizedSearch))
        .filter(
            product ->
                categoryId == null
                    || product.getCategories().stream()
                        .anyMatch(
                            category -> category.getId().equals(categoryId)))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ProductResponse> findPublicByIds(List<Long> ids) {
    if (ids == null || ids.size() > 100) {
      throw new InvalidRequestException("Informe até 100 produtos.");
    }
    if (ids.isEmpty()) return List.of();
    return products.findByIdIn(ids).stream().filter(Product::isActive)
        .map(ProductResponse::from).toList();
  }

  @Transactional(readOnly = true)
  public ProductPageResponse findPublicPage(
      String query, Long categoryId, int page, int size) {
    if (page < 0 || size < 1 || size > 100) {
      throw new InvalidRequestException("Paginação inválida.");
    }
    var result = search.find(normalize(query), categoryId, page, size);
    if (result.ids().isEmpty()) {
      return new ProductPageResponse(List.of(), result.total(), page, size);
    }
    var byId = new HashMap<Long, Product>();
    products.findByIdIn(result.ids()).forEach(p -> byId.put(p.getId(), p));
    var rows = result.ids().stream().map(byId::get).filter(Objects::nonNull)
        .map(ProductResponse::from).toList();
    return new ProductPageResponse(rows, result.total(), page, size);
  }

  @Transactional(readOnly = true)
  public Product findPublicBySlug(String slug) {
    return products
        .findBySlugAndActiveTrue(slug)
        .orElseThrow(() -> new ProductNotFoundException(slug));
  }

  @Transactional(readOnly = true)
  public List<Product> findAllForAdmin() {
    return products.findAllByOrderByNameAsc();
  }

  @Transactional(readOnly = true)
  public Product findForAdmin(Long id) {
    return products
        .findById(id)
        .orElseThrow(() -> new ProductNotFoundException(id.toString()));
  }

  @Transactional
  public Product create(ProductUpsertRequest request) {
    ValidatedProduct input = validate(request);
    assertVariantSkusAvailable(input.variants(), null);
    String slug = uniqueSlug(input.name());
    Product product =
        new Product(
            nextCode(),
            slug,
            input.name(),
            input.brand(),
            input.description(),
            input.imageUrl(),
            input.minimumStock(),
            input.active(),
            input.categories());
    input.variants().forEach(variant -> product.addVariant(toVariant(variant)));
    return products.save(product);
  }

  @Transactional
  public Product update(Long id, ProductUpsertRequest request) {
    Product product = findForAdmin(id);
    ValidatedProduct input = validate(request);
    assertVariantSkusAvailable(input.variants(), product.getId());
    product.update(
        input.name(),
        input.brand(),
        input.description(),
        input.imageUrl(),
        input.minimumStock(),
        input.active(),
        input.categories());
    product.clearVariants();
    products.flush();
    input.variants().forEach(variant -> product.addVariant(toVariant(variant)));
    return products.save(product);
  }

  @Transactional
  public void deactivate(Long id) {
    Product product = findForAdmin(id);
    product.deactivate();
    products.save(product);
  }

  private ValidatedProduct validate(ProductUpsertRequest request) {
    if (request == null
        || isBlank(request.name())
        || isBlank(request.brand())
        || isBlank(request.description())
        || request.minimumStock() == null
        || request.minimumStock() < 0
        || request.categoryIds() == null
        || request.categoryIds().isEmpty()
        || request.variants() == null
        || request.variants().isEmpty()) {
      throw new InvalidRequestException(
          "Preencha os dados obrigatórios do "
              + "produto e informe ao menos uma variação.");
    }
    Set<Long> categoryIds = new LinkedHashSet<>(request.categoryIds());
    if (categoryIds.contains(null) || categoryIds.isEmpty()) {
      throw new InvalidRequestException("Informe ao menos uma categoria.");
    }
    List<Category> selectedCategories =
        categories.findByIdInAndDeletedAtIsNull(categoryIds);
    if (selectedCategories.size() != categoryIds.size()) {
      throw new InvalidRequestException(
          "Uma ou mais categorias informadas não existem ou estão inativas.");
    }
    List<ProductVariantRequest> variants = request.variants();
    Set<String> skus = new java.util.HashSet<>();
    for (ProductVariantRequest variant : variants) {
      if (variant == null
          || isBlank(variant.sku())
          || isBlank(variant.label())
          || variant.priceCents() == null
          || variant.priceCents() < 0
          || variant.stockQuantity() == null
          || variant.stockQuantity() < 0
          || !skus.add(variant.sku().trim().toUpperCase(Locale.ROOT))) {
        throw new InvalidRequestException(
            "Cada variação precisa de SKU único, "
                + "nome, preço e estoque válidos.");
      }
    }
    return new ValidatedProduct(
        request.name().trim(),
        request.brand().trim(),
        request.description().trim(),
        trimToNull(request.imageUrl()),
        request.minimumStock(),
        request.active() == null || request.active(),
        new LinkedHashSet<>(selectedCategories),
        variants);
  }

  private void assertVariantSkusAvailable(
      List<ProductVariantRequest> variants, Long productId) {
    for (ProductVariantRequest variant : variants) {
      String sku = variant.sku().trim().toUpperCase(Locale.ROOT);
      boolean exists =
          productId == null
              ? this.variants.existsBySku(sku)
              : this.variants.existsBySkuAndProductIdNot(sku, productId);
      if (exists) {
        throw new ConflictException(
            "Já existe uma variação com o SKU " + sku + ".");
      }
    }
  }

  private ProductVariant toVariant(ProductVariantRequest request) {
    return new ProductVariant(
        request.sku().trim().toUpperCase(Locale.ROOT),
        request.label().trim(),
        trimToNull(request.color()),
        trimToNull(request.size()),
        request.priceCents(),
        request.stockQuantity());
  }

  private String uniqueSlug(String name) {
    String base = slugify(name);
    String slug = base;
    while (products.existsBySlug(slug)) {
      slug = base + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
    return slug;
  }

  private static String nextCode() {
    return "PRD-"
        + UUID.randomUUID()
            .toString()
            .replace("-", "")
            .substring(0, 12)
            .toUpperCase(Locale.ROOT);
  }

  private static boolean containsSearch(Product product, String search) {
    return normalize(product.getName()).contains(search)
        || normalize(product.getBrand()).contains(search)
        || normalize(product.getDescription()).contains(search);
  }

  private static String slugify(String value) {
    String normalized =
        Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
    return normalized
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-|-$)", "");
  }

  private static String normalize(String value) {
    return value == null
        ? ""
        : Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .trim()
            .toLowerCase(Locale.ROOT);
  }

  private static String trimToNull(String value) {
    return isBlank(value) ? null : value.trim();
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private record ValidatedProduct(
      String name,
      String brand,
      String description,
      String imageUrl,
      int minimumStock,
      boolean active,
      Set<Category> categories,
      List<ProductVariantRequest> variants) {}
}
