CREATE INDEX idx_cart_items_reservation_due
    ON cart_items (reserved_until, expiry_warning_sent, cart_id);
