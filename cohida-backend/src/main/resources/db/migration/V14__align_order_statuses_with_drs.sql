ALTER TABLE cohida.orders DROP CONSTRAINT IF EXISTS ck_orders_status;

UPDATE cohida.orders
SET status = 'APROVADA'
WHERE status = 'PAGAMENTO_REALIZADO';

ALTER TABLE cohida.orders
    ADD CONSTRAINT ck_orders_status CHECK (
        status IN ('EM_ABERTO', 'EM_PROCESSAMENTO', 'APROVADA', 'REPROVADA',
                   'EM_TRANSITO', 'ENTREGUE', 'CANCELADO')
    );
