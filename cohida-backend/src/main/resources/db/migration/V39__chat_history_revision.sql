CREATE TABLE chat_state (
    customer_id BIGINT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    history_revision BIGINT NOT NULL DEFAULT 0
);

CREATE TRIGGER audit_write AFTER INSERT OR UPDATE OR DELETE ON chat_state
    FOR EACH ROW EXECUTE FUNCTION audit_row_write();
