CREATE TABLE chat_profile (
    customer_id BIGINT PRIMARY KEY REFERENCES customers(id),
    sport VARCHAR(40),
    experience VARCHAR(40),
    goal VARCHAR(40),
    budget VARCHAR(40),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
