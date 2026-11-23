CREATE TABLE chat_response_products (
    response_id BIGINT NOT NULL REFERENCES chat_responses(id) ON DELETE CASCADE,
    product_slug VARCHAR(160) NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (response_id, product_slug)
);
