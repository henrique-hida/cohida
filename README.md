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
customers, and orders. Compose enables the demo profile. The endpoint requires
an administrator and is disabled when the production profile is active. The
script uses the local E2E administrator by default; override its login with
`COHIDA_DEMO_ADMIN_EMAIL` and `COHIDA_DEMO_ADMIN_PASSWORD` when needed.

```bash
npm run demo:seed
```

Deactivate the demo products and coupons:

```bash
npm run demo:remove
```

Set `COHIDA_API_URL` to use an API base other than
`http://localhost:8080/api`.

## Pagamentos simulados

O pagamento é processado localmente e não gera cobrança. Use apenas dados
fictícios: os formulários atuais não integram um serviço de tokenização real.
No formulário, o número de teste `4000 0000 0000 0002` simula uma recusa;
outros números fictícios válidos simulam aprovação. Em testes de backend, um
token com prefixo `unavailable-` simula falha do processador. Nenhum desses
cenários acessa um provedor externo.

O resultado aprovado ou recusado é registrado no outbox na mesma transação do
pedido. No Compose, o processo publica os eventos no Redis Streams e cria uma
notificação interna em segundo plano. O PostgreSQL mantém o registro durável e
a deduplicação; mensagens sem conclusão são republicadas e mensagens pendentes
de consumidores interrompidos são recuperadas. O processamento não envia
e-mails. A fila fica desligada por padrão fora do Compose; configure
`COHIDA_QUEUE_ENABLED=true` e o endereço do Redis para habilitá-la.

Os eventos com cinco falhas ficam registrados em `payment_outbox.failed_at` e
exigem investigação antes de reprocessar. Monitore também eventos pendentes e
logs de falha. O Redis da fila usa AOF, limite de memória e `noeviction` no
Compose; em produção, configure persistência, alertas e dimensionamento
compatíveis com a carga. Não compartilhe sua política de memória com cache.

## Cache de categorias

O Compose inicia um Redis independente para cache, limitado a 32 MB com
`allkeys-lfu` e sem volume. A API usa cache apenas para a lista pública de
categorias, com TTL de 60 a 75 segundos e invalidação após commit. Estoque,
preços finais, pagamentos e dados privados continuam no PostgreSQL. Se o Redis
falhar, a leitura consulta o banco; uma falha na invalidação pode manter dados
antigos até o TTL expirar.

Fora do Compose, o cache fica desligado por padrão. Para habilitá-lo, configure
`COHIDA_CACHE_ENABLED`, `COHIDA_CACHE_HOST`, `COHIDA_CACHE_PORT` e um
`COHIDA_CACHE_NAMESPACE` exclusivo por ambiente e versão; quando necessário,
configure `COHIDA_CACHE_PASSWORD` e `COHIDA_CACHE_SSL=true` no backend. Use
uma instância separada da fila. Monitore latência, hit rate, memória e
expulsões antes de ampliar o cache. O preenchimento é agrupado por processo;
com várias réplicas, medir concorrência antes de adotar um lock distribuído.

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
para clientes autenticados. O chat apresenta perguntas para conhecer as
preferências do cliente; o backend as combina com os itens de pedidos
aprovados, em transporte ou entregues e com o catálogo ativo disponível.
As perguntas, respostas e avaliações são registradas no banco. O histórico
da conversa é recuperado ao abrir o chat. A primeira lista de produtos da home
usa interesses informados e categorias de compras para ordenar produtos
disponíveis; sem esses sinais, apresenta uma seleção geral. As avaliações das
respostas também influenciam a conversa e têm peso reduzido na ordem dos
produtos associados. Ao limpar a conversa, suas avaliações são removidas.

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

Esta versão utiliza os dados disponíveis como contexto para personalizar as
respostas e registra as avaliações dos clientes.
