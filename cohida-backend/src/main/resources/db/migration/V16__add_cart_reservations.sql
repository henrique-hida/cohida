ALTER TABLE cohida.cart_items
    ADD COLUMN reserved_until TIMESTAMP;

CREATE INDEX ix_cart_items_reservation
    ON cohida.cart_items (variant_id, reserved_until);
