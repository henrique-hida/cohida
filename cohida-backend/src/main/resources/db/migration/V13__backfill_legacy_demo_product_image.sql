UPDATE cohida.products
SET image_url = '/products/camiseta-match-training.png'
WHERE id IN (
    SELECT product_id
    FROM cohida.product_variants
    WHERE sku = 'DEMO-CAMISA-M'
);
