CREATE TABLE auth_sessions (
    id VARCHAR(36) PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    refresh_token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    last_used_at TIMESTAMP
);
CREATE INDEX ix_auth_sessions_account ON auth_sessions (account_id);
CREATE TRIGGER audit_write AFTER INSERT OR UPDATE OR DELETE ON auth_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_row_write();
