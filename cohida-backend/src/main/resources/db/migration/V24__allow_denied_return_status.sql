ALTER TABLE cohida.return_requests
    DROP CONSTRAINT IF EXISTS ck_return_requests_status;

ALTER TABLE cohida.return_requests
    ADD CONSTRAINT ck_return_requests_status
        CHECK (status IN ('EM_TROCA', 'TROCA_AUTORIZADA', 'TROCA_NEGADA', 'TROCADO'));
