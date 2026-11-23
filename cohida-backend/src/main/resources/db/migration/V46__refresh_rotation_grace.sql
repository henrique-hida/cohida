ALTER TABLE auth_sessions ADD COLUMN previous_refresh_token_hash VARCHAR(64);
ALTER TABLE auth_sessions ADD COLUMN rotation_grace_until TIMESTAMP;
