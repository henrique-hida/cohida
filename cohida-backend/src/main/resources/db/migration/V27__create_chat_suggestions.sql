CREATE TABLE chat_suggestions (
    customer_id BIGINT NOT NULL REFERENCES chat_preferences(customer_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    question VARCHAR(180) NOT NULL,
    PRIMARY KEY (customer_id, position)
);
