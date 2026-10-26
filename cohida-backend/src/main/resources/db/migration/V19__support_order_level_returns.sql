ALTER TABLE cohida.return_requests
    ALTER COLUMN order_item_id DROP NOT NULL,
    ADD COLUMN order_id BIGINT REFERENCES cohida.orders (id),
    ADD COLUMN restock_items BOOLEAN;

ALTER TABLE cohida.return_requests
    ADD CONSTRAINT ck_return_target CHECK (order_item_id IS NOT NULL OR order_id IS NOT NULL);
