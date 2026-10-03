package com.hida.cohida.product.service;

import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ProductServiceTest {
    @Autowired
    private ProductService products;

    @Test
    void createsUpdatesStockAndDeactivatesProduct() {
        Product product = products.create(request("Camisa Oficial", 18990, 8));

        assertTrue(product.isActive());
        assertEquals(1, products.findPublic(null, null).size());

        Product updated = products.update(product.getId(), request("Camisa Oficial 2026", 19990, 6));
        assertEquals("Camisa Oficial 2026", updated.getName());
        assertEquals(19990, updated.getVariants().getFirst().getPriceCents());

        products.updateStock(product.getId(), updated.getVariants().getFirst().getId(), 3);
        assertEquals(3, products.findForAdmin(product.getId()).getVariants().getFirst().getStockQuantity());

        products.deactivate(product.getId());
        assertTrue(products.findPublic(null, null).isEmpty());
        assertFalse(products.findForAdmin(product.getId()).isActive());
    }

    private static ProductUpsertRequest request(String name, long priceCents, int stockQuantity) {
        return new ProductUpsertRequest(name, "Cohida", "Camisa esportiva", List.of("Futebol"), 2, true,
                List.of(new ProductVariantRequest("CAMISA-OFICIAL-M", "M", "Azul", "M", priceCents, stockQuantity)));
    }
}
