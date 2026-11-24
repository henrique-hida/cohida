CREATE TABLE chat_category_interests (
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    category_id BIGINT NOT NULL REFERENCES categories(id),
    experience VARCHAR(20) CHECK (experience IN
        ('Iniciante', 'Intermediário', 'Avançado')),
    PRIMARY KEY (customer_id, category_id)
);

-- Preserve the original rows and global experience for later reconciliation.
INSERT INTO chat_category_interests (customer_id, category_id)
SELECT DISTINCT i.customer_id, c.id
FROM chat_interests i
JOIN categories c ON c.slug = CASE i.sport
    WHEN 'Corrida' THEN 'running'
    WHEN 'Futebol' THEN 'football'
    WHEN 'Judô' THEN 'martial-arts'
    WHEN 'Treino' THEN 'training'
    WHEN 'Trilha' THEN 'outdoor'
    ELSE NULL
END
ON CONFLICT DO NOTHING;

CREATE TRIGGER audit_write AFTER INSERT OR UPDATE OR DELETE
    ON chat_category_interests FOR EACH ROW
    EXECUTE FUNCTION audit_row_write();
