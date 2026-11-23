CREATE TABLE product_image_jobs (
    id VARCHAR(36) PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP,
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    next_attempt_at TIMESTAMP,
    claim_token VARCHAR(36),
    claimed_until TIMESTAMP,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error VARCHAR(120),
    CONSTRAINT ck_product_image_attempts CHECK (attempts >= 0)
);

CREATE INDEX ix_image_jobs_pending ON product_image_jobs
    (next_attempt_at, published_at, created_at)
    WHERE processed_at IS NULL AND failed_at IS NULL;
CREATE TRIGGER audit_write AFTER INSERT OR UPDATE OR DELETE ON product_image_jobs
    FOR EACH ROW EXECUTE FUNCTION audit_row_write();
