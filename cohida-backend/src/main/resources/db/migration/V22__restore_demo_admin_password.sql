-- Keep the seeded administrator credential aligned with the existing UI suite.
UPDATE cohida.accounts
SET password_hash = '$2y$12$lQavSRWXugWo2qrM892rmOE9oCbUSn6ZOMmXDhwlmypbFNIluCP5G'
WHERE email = 'hmhida@icloud.com' AND role = 'ADMIN';
