ALTER TABLE orders DROP CONSTRAINT IF EXISTS ck_orders_status;
ALTER TABLE orders ADD CONSTRAINT ck_orders_status CHECK (
    status IN ('EM_ABERTO', 'EM_PROCESSAMENTO', 'APROVADA', 'REPROVADA',
               'EM_TRANSITO', 'ENTREGUE', 'CANCELADO', 'EM_TROCA',
               'TROCA_AUTORIZADA', 'TROCADO')
);

UPDATE orders o SET status = CASE latest.status
    WHEN 'EM_TROCA' THEN 'EM_TROCA'
    WHEN 'TROCA_AUTORIZADA' THEN 'TROCA_AUTORIZADA'
    WHEN 'TROCADO' THEN 'TROCADO'
    ELSE o.status END
FROM (
    SELECT DISTINCT ON (order_id) order_id, status
    FROM return_requests
    WHERE order_id IS NOT NULL AND order_item_id IS NULL
    ORDER BY order_id, id DESC
) latest
WHERE o.id = latest.order_id AND o.status = 'ENTREGUE';
