-- Massa isolada para análise de vendas. Execute após npm run demo:seed.
-- As categorias e os códigos são exclusivos para não misturar outras vendas.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cohida.accounts WHERE email = 'ana.demo@cohida.test' AND customer_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Execute npm run demo:seed antes de preparar a massa de análise.';
  END IF;
END $$;

INSERT INTO cohida.categories (created_at, updated_at, slug, name, description)
VALUES (now(), now(), 'analytics-demo-a', 'Análise teste A', 'Categoria isolada para teste de análise.'),
       (now(), now(), 'analytics-demo-b', 'Análise teste B', 'Categoria isolada para teste de análise.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO cohida.products (created_at, updated_at, code, slug, name, brand, description, minimum_stock, active)
VALUES (now(), now(), 'ANALYTICS-DEMO-A', 'analytics-demo-a', 'Análise teste: duas categorias', 'Demo', 'Produto de teste para análise.', 0, true),
       (now(), now(), 'ANALYTICS-DEMO-B', 'analytics-demo-b', 'Análise teste: categoria B', 'Demo', 'Produto de teste para análise.', 0, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO cohida.product_categories (product_id, category)
SELECT p.id, c.category FROM cohida.products p
JOIN (VALUES ('ANALYTICS-DEMO-A', 'analytics-demo-a'), ('ANALYTICS-DEMO-A', 'analytics-demo-b'),
             ('ANALYTICS-DEMO-B', 'analytics-demo-b')) c(code, category) ON p.code = c.code
ON CONFLICT DO NOTHING;

INSERT INTO cohida.product_variants (created_at, updated_at, product_id, sku, label, price_cents, stock_quantity)
SELECT now(), now(), p.id, p.code || '-SKU', 'Único', CASE WHEN p.code = 'ANALYTICS-DEMO-A' THEN 10000 ELSE 20000 END, 10
FROM cohida.products p WHERE p.code IN ('ANALYTICS-DEMO-A', 'ANALYTICS-DEMO-B')
ON CONFLICT (sku) DO NOTHING;

WITH samples(marker, month_number, status, subtotal, discount, shipping) AS (
    VALUES ('ANALYTICS-DEMO-JAN', 1, 'ENTREGUE', 30000, 3000, 5000),
           ('ANALYTICS-DEMO-FEB', 2, 'ENTREGUE', 10000, 0, 1000),
           ('ANALYTICS-DEMO-MAR', 3, 'EM_TRANSITO', 20000, 0, 1000),
           ('ANALYTICS-DEMO-APR', 4, 'ENTREGUE', 30001, 1, 0)
)
INSERT INTO cohida.orders (created_at, updated_at, customer_id, status, subtotal_cents, discount_cents, shipping_cents,
                           total_cents, coupon_code, coupon_value_cents, card_brand, card_last_digits,
                           delivery_label, delivery_street, delivery_number, delivery_neighborhood,
                           delivery_zip_code, delivery_city, delivery_state, delivery_country)
SELECT make_timestamp(extract(year from current_date)::int, s.month_number, 15, 12, 0, 0), now(), a.customer_id,
       s.status, s.subtotal, s.discount, s.shipping, s.subtotal - s.discount + s.shipping, s.marker || '-' || extract(year from current_date)::int, s.discount,
       'VISA', '1111', 'Teste', 'Rua Teste', '1', 'Centro', '01001000', 'São Paulo', 'SP', 'Brasil'
FROM samples s CROSS JOIN cohida.accounts a
WHERE a.email = 'ana.demo@cohida.test'
  AND NOT EXISTS (SELECT 1 FROM cohida.orders o WHERE o.coupon_code = s.marker || '-' || extract(year from current_date)::int);

WITH samples(marker, sku, price) AS (
    VALUES ('ANALYTICS-DEMO-JAN', 'ANALYTICS-DEMO-A-SKU', 10000), ('ANALYTICS-DEMO-JAN', 'ANALYTICS-DEMO-B-SKU', 20000),
           ('ANALYTICS-DEMO-FEB', 'ANALYTICS-DEMO-A-SKU', 10000), ('ANALYTICS-DEMO-MAR', 'ANALYTICS-DEMO-B-SKU', 20000),
           ('ANALYTICS-DEMO-APR', 'ANALYTICS-DEMO-A-SKU', 10001), ('ANALYTICS-DEMO-APR', 'ANALYTICS-DEMO-B-SKU', 20000)
)
INSERT INTO cohida.order_items (created_at, updated_at, order_id, variant_id, product_name, sku, variant_label, unit_price_cents, quantity)
SELECT now(), now(), o.id, v.id, p.name, v.sku, v.label, s.price, 1
FROM samples s JOIN cohida.orders o ON o.coupon_code = s.marker || '-' || extract(year from current_date)::int
JOIN cohida.product_variants v ON v.sku = s.sku JOIN cohida.products p ON p.id = v.product_id
WHERE NOT EXISTS (SELECT 1 FROM cohida.order_items i WHERE i.order_id = o.id AND i.sku = s.sku);
COMMIT;
