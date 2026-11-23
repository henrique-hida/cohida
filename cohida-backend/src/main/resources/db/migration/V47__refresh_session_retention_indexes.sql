CREATE INDEX ix_auth_sessions_expiry ON auth_sessions (expires_at);
CREATE INDEX ix_auth_sessions_revoked ON auth_sessions (revoked_at)
    WHERE revoked_at IS NOT NULL;
