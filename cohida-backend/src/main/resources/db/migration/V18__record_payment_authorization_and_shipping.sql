ALTER TABLE cohida.orders
    ADD COLUMN payment_authorized_at TIMESTAMP,
    ADD COLUMN payment_authorization_reason VARCHAR(500);
