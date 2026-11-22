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

From `cohida-frontend`, run the npm command to load demo products, coupons,
customers, and orders. The demo endpoint is public and intended for testing;
remove or secure it before deploying to production.

```bash
npm run demo:seed
```

Deactivate the demo products and coupons:

```bash
npm run demo:remove
```

Set `COHIDA_API_URL` to use an API base other than
`http://localhost:8080/api`.

## Sales analysis tests

With the Compose backend and PostgreSQL running, run `npm run demo:seed` once
from `cohida-frontend`. The Cypress tests prepare their dedicated sales-analysis
data in PostgreSQL and reset the test order's delivery status. To open Cypress
for the demonstration, run `npm run cy:open` from `cohida-frontend`. To run the
full Cypress suite headlessly, use `npm run cy:run`; to run it in a visible
Chrome window, use `npm run cy:run:headed`. These commands start their own Vite
server on port 5174. To run only the eight sales-analysis scenarios headlessly:

```bash
npx start-server-and-test 'vite --host 127.0.0.1 --port 5174 --strictPort' http://127.0.0.1:5174 'cypress run --spec "cypress/e2e/sales-analytics/*.cy.ts"'
```

The named dependency volumes are preserved by `down`. To deliberately remove
them and force clean dependency installation, run `docker compose down -v`.

## Assistente de recomendação

O chatbot usa Spring AI para se comunicar com o OpenRouter e está disponível
para clientes autenticados. O cliente informa suas
preferências no próprio chat; o backend as combina com os itens de pedidos
aprovados, em transporte ou entregues e com o catálogo ativo disponível.
As perguntas, respostas e avaliações são registradas no banco. O histórico
da conversa exibido fica disponível durante a sessão da página.

Para usar o OpenRouter, defina no `.env` da raiz:

```dotenv
OPENROUTER_API_KEY=sua_chave
OPENROUTER_MODEL=openrouter/free
```

O modelo pode ser alterado para outro identificador disponível na conta. A chave
fica apenas no backend. Após alterar o `.env`, recrie o backend para atualizar
as variáveis do contêiner:

```bash
docker compose up -d --build backend
```

O modelo recebe preferências, nomes dos itens comprados, dados do catálogo e
mensagens da conversa, mas não recebe dados de pagamento ou endereço. Como o
modelo e seu provedor podem processar esses dados, use dados de demonstração
para testes e consulte as políticas do provedor escolhido. A disponibilidade e
os limites dependem do modelo e da conta OpenRouter.

Esta versão usa apenas contexto: não executa treinamento ou ajuste fino. O
item de treinamento do RNF0044 e da atividade permanece pendente de decisão.
