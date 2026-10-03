INSERT INTO cohida.admins (created_at, updated_at, name)
VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Henrique Hida');

INSERT INTO cohida.accounts (created_at, updated_at, admin_id, email, password_hash, role)
SELECT CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP,
       id,
       'hmhida@icloud.com',
       '$2y$12$lQavSRWXugWo2qrM892rmOE9oCbUSn6ZOMmXDhwlmypbFNIluCP5G',
       'ADMIN'
FROM cohida.admins
WHERE name = 'Henrique Hida';
