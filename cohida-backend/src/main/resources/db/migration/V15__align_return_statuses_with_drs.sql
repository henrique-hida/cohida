ALTER TABLE cohida.return_requests DROP CONSTRAINT IF EXISTS ck_return_requests_status;
ALTER TABLE cohida.return_requests DROP CONSTRAINT IF EXISTS ck_return_status;

UPDATE cohida.return_requests
SET status = CASE status
    WHEN 'SOLICITADA' THEN 'EM_TROCA'
    WHEN 'ACEITA' THEN 'TROCA_AUTORIZADA'
    WHEN 'ITEM_ENVIADO' THEN 'TROCA_AUTORIZADA'
    WHEN 'ITEM_RECEBIDO' THEN 'TROCA_AUTORIZADA'
    WHEN 'PROCESSADA' THEN 'TROCADO'
    ELSE status
END;

ALTER TABLE cohida.return_requests
    ADD CONSTRAINT ck_return_requests_status CHECK (status IN ('EM_TROCA', 'TROCA_AUTORIZADA', 'TROCADO'));
