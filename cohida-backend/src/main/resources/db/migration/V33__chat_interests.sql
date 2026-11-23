CREATE TABLE chat_interests (
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    sport VARCHAR(40) NOT NULL,
    focus VARCHAR(80),
    PRIMARY KEY (customer_id, sport)
);

INSERT INTO chat_interests (customer_id, sport)
SELECT customer_id, sport FROM chat_profile
WHERE sport IN ('Corrida', 'Futebol', 'Judô', 'Treino');
