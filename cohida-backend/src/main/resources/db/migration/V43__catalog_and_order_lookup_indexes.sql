-- Supports the public catalog's stable first-page ordering without indexing
-- inactive products. Foreign keys do not create an order_items lookup index.
CREATE INDEX ix_products_active_name_id
    ON cohida.products (name, id) WHERE active = true;
CREATE INDEX ix_order_items_order_id ON cohida.order_items (order_id);
