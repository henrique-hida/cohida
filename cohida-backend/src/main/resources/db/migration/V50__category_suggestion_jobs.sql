CREATE TABLE category_suggestion_jobs (
    category_id BIGINT PRIMARY KEY REFERENCES categories(id),
    status VARCHAR(20) NOT NULL CHECK (status IN
        ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EDITED')),
    attempts INTEGER NOT NULL DEFAULT 0,
    token UUID,
    started_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER audit_write AFTER INSERT OR UPDATE OR DELETE
    ON category_suggestion_jobs FOR EACH ROW
    EXECUTE FUNCTION audit_row_write();

INSERT INTO category_suggestion_jobs (category_id, status)
SELECT c.id, 'PENDING' FROM categories c
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM category_chat_suggestions s WHERE s.category_id = c.id
  );
