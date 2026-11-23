CREATE TABLE payment_outbox (
    event_id VARCHAR(36) PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    event_type VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP,
    CONSTRAINT uk_payment_outbox_order UNIQUE (order_id)
);

CREATE INDEX idx_payment_outbox_pending
    ON payment_outbox (published_at, created_at);
