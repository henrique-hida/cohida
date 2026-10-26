# coHida

## Docker development environment

The Compose stack runs the React/Vite storefront and Spring Boot API with hot
reload. Docker Desktop must be running first.

```bash
docker compose up --build
```

Open the storefront at <http://localhost:5173>. The API is available at
<http://localhost:8080>.

The frontend uses `http://localhost:8080/api` when started through Compose.
This address is intentionally public to the browser; service-to-service Docker
network names must not be used in `VITE_*` variables.

PostgreSQL is available at `localhost:5432` with the development credentials in
[.env.example](.env.example). Copy that file to `.env` and change the password
before running the stack if you need local credentials different from the
defaults. The database data is stored in the `postgres_data` named volume.

The backend connects through the Docker-only `postgres` hostname and runs
versioned Flyway migrations from `cohida-backend/src/main/resources/db/migration`.
Create the first migration there when the initial domain schema is defined;
Hibernate validates migrations rather than changing the schema automatically.

Stop the stack with:

```bash
docker compose down
```

## Demo data commands

Provide an administrator access token in `COHIDA_ADMIN_TOKEN` before running
these commands. The token can be copied from the `accessToken` field returned
by `POST /api/auth/login`.

From `cohida-frontend`, set the token and run the npm command to load demo
products, coupons, customers, and orders:

```bash
export COHIDA_ADMIN_TOKEN="<token>"
npm run demo:seed
```

Deactivate the demo products and coupons:

```bash
npm run demo:remove
```

Set `COHIDA_API_URL` to use an API base other than
`http://localhost:8080/api`.

The named dependency volumes are preserved by `down`. To deliberately remove
them and force clean dependency installation, run `docker compose down -v`.
