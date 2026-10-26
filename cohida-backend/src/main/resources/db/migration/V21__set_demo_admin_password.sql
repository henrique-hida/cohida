-- Deterministic credential for the Docker-backed functional demonstration suite.
UPDATE cohida.accounts
SET password_hash = '$2y$10$J.NwFeaE/36nqDVkWpTIcOMQo7475uNx9KniIY1bWsebRipKYCCnW'
WHERE email = 'hmhida@icloud.com' AND role = 'ADMIN';
