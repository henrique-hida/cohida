ALTER TABLE payment_outbox ADD COLUMN processed_at TIMESTAMP;
ALTER TABLE payment_outbox ADD COLUMN failed_at TIMESTAMP;
ALTER TABLE payment_outbox ADD COLUMN next_attempt_at TIMESTAMP;
ALTER TABLE payment_outbox ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payment_outbox ADD COLUMN last_error VARCHAR(120);

CREATE INDEX idx_payment_outbox_delivery
    ON payment_outbox (processed_at, failed_at, next_attempt_at, created_at);
