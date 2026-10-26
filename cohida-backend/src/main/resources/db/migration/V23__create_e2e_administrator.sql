-- Dedicated non-production identity for browser E2E tests. It never changes a human administrator.
INSERT INTO cohida.admins (created_at, updated_at, name)
SELECT CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Cypress E2E'
WHERE NOT EXISTS (
    SELECT 1 FROM cohida.admins WHERE name = 'Cypress E2E'
);

INSERT INTO cohida.accounts (created_at, updated_at, admin_id, email, password_hash, role)
SELECT CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP,
       id,
       'e2e.admin@cohida.test',
       '$2y$12$7VBGGVI95YYNeBIJedu0i.4.AvOlWVashH8UpeffwMfrZLa9ZKnMC',
       'ADMIN'
FROM cohida.admins
WHERE name = 'Cypress E2E'
  AND NOT EXISTS (
      SELECT 1 FROM cohida.accounts WHERE email = 'e2e.admin@cohida.test'
  );
