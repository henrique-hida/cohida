ALTER TABLE cohida.orders
    ADD COLUMN approved_at TIMESTAMP,
    ADD COLUMN dispatched_at TIMESTAMP,
    ADD COLUMN delivered_at TIMESTAMP;
