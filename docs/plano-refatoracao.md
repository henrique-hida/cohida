# Refatoração e preparação para produção do Cohida

Plano de implementação para uma IA trabalhar em etapas revisáveis. A revisão
abrangeu o inventário do backend, frontend, testes, migrações e infraestrutura,
com leitura dirigida das fronteiras críticas. Os achados abaixo são de análise
estática. Hipóteses de concorrência e desempenho precisam ser reproduzidas em
PostgreSQL e staging durante a implementação.

## Achados e ordem de correção

| Prioridade | Evidência no checkout | Ação |
| --- | --- | --- |
| P0 | `SecurityConfig` libera `/api/admin/demo/seed`. `AdminDemoController` usa a mesma rota para leitura, criação e desativação. | Restringir controller a perfil local/demo e exigir administrador. Validar ausência em produção e adaptar bootstrap Cypress. |
| P0 | `OrderService.checkout` (432 linhas no serviço) tem `noRollbackFor = InvalidRequestException`, grava pedido, limpa carrinho e chama autorização na mesma transação. `processPayment` atualiza estoque antes de concluir cupons e transição. | Reproduzir falha após escrita e retirar a exceção ampla de rollback. Aplicar a reconciliação intencional do carrinho em transação própria e devolver erro após commit. Extrair checkout e transições; testar atomicidade de estoque, pedido e cupons. |
| P0 | Checkout usa `SimulatedPaymentProcessor`. | Manter o simulador local nos ambientes de demonstração. Antes de aceitar cobranças reais, replanejar tokenização, integração com PSP, webhook, reconciliação e estorno. |
| P0 | `SaleOrder.cancel` permite cancelar pedidos em aberto ou processamento, mas `OrderService.cancel` soma as quantidades ao estoque sem verificar se houve baixa anterior. A baixa ocorre na aprovação em `OrderPaymentService`. | Corrigir a transição e os efeitos do cancelamento antes de adicionar pagamentos reais. Bloquear o pedido para evitar cancelamentos concorrentes, restaurar somente movimentações efetivamente realizadas e revisar cupons, inclusive múltiplos. Reproduzir os casos em PostgreSQL isolado e validar pela UI quando aplicável. |
| P1 | `OrderRepository.aggregateDeliveredSalesByCategory` filtra só ENTREGUE. DRS RN0074 inclui APROVADA, EM_TRANSITO e ENTREGUE. | Corrigir predicado e nome da consulta. Testar os três status e exclusões, intervalo inclusivo, categorias e rateio de desconto. Usar quebras SQL entre tokens e revisar o SQL nativo em PostgreSQL. |
| P1 | `V4__drop_audit_logs.sql` remove a tabela original. RNF0012 exige ator, horário e dados alterados. | Inventariar cobertura atual. Implementar auditoria com migração nova e dados mínimos permitidos, distinguindo ator humano de worker. |
| P1 | `ChatService` (767 linhas) concentra perfis, preferências antigas, ranking, histórico com consultas por resposta, sugestões, prompts, parsing e SQL. `respond` e `generateSuggestions` mantêm escopo transacional durante a chamada de IA. | Separar persistência, contexto/ranking e gateway de IA. Carregar snapshots em transações curtas, chamar IA fora delas e salvar em nova transação. Buscar cards de todo histórico em lote. Proteger contra uma geração em voo repovoar histórico apagado. |
| P1 | `CartService` (282 linhas) mistura preço, cupom, reserva e mutações. `view` pode expirar itens e salvar. `expireAllReservations` percorre todos os carrinhos e é ação administrativa. | Extrair cálculo puro e ciclo de reserva. Revisar locks e ordem de aquisição entre carrinho, variante, cupom e pedido. Separar expiração por vencimento da liberação administrativa. Medir consultas e processar lotes. |
| P1 | `ReturnService` lê pedido de troca e emite cupom/reestoca na conclusão. `dispatchExchange` do frontend não tem consumidor de UI encontrado no inventário. | Serializar transições concorrentes da mesma troca, validar emissão única e verificar se rastreio precisa de entrada na UI com base no DRS. Preservar endpoint e rastreio existente. |
| P1 | `ProductService.findPublic` carrega catálogo ativo e filtra em memória. Analytics também carrega pedidos para overview/top. | Medir planos, consultas e volumes. Mover filtros e agregações para consultas paginadas quando necessário, com índices justificados e contrato migrado em conjunto com o frontend. |
| P2 | `DemoSeederService` tem 1.222 linhas, incluindo mais de 400 de catálogo. | Após isolar o perfil, separar fixtures de catálogo, clientes, pedidos, cupons e avaliações do orquestrador. Preservar SKUs e cenários Cypress. |
| P2 | `CustomerService` (336 linhas) combina perfil, senha, endereço e CPF. `ProductService` (273) combina consulta, atualização, estoque e normalização. | Extrair validação compartilhada onde houver duplicação real com AuthService. Separar operações de endereço e estoque conforme fronteiras de transação. Preservar erros, autorização e restrições únicas. |
| P2 | Frontend tem `ChatbotFab` (325), `ChatProfile` (306), `AdminDashboardPage` (300), `demoCommerceRepository` (284) e `useCheckout` (256). | Separar painel e preferências do estado do chat. Migrar o repositório de comércio por domínio e renomear quando todos os imports forem migrados. Revisar recargas após mutação e descartar respostas de sessão anterior. Dividir dashboard pelas consultas e blocos visuais que já têm responsabilidades distintas. |
| P2 | `customerApi` trata 401 e 403 como expiração. `session.ts` guarda tokens de contas salvas no navegador. | Tratar 403 como acesso negado. Planejar troca de conta com expiração/revogação e migrar armazenamento de credenciais em lote próprio. Preservar componentes de UI customizados e acessibilidade. |

Linhas são indicadores de concentração. Entidades e componentes coesos
podem permanecer juntos. Usar enums e nomes do domínio, evitar renomeações
globais e manter SQL e prompts legíveis, sem quebrar palavras para formatação.

## Andamento e próximo lote

O isolamento da rota de seed e a extração do checkout já foram implementados.
Os testes do checkout cobriram rollback e concorrência com PostgreSQL isolado.
Revalidar o estado do código e as alterações existentes antes de continuar.

O cancelamento de pedidos em aberto ou em processamento foi corrigido para
preservar estoque e cupons que ainda não foram consumidos. O pedido é bloqueado
durante a transição. Testes em PostgreSQL isolado cobriram cupons múltiplos e
cancelamentos simultâneos.

A idempotência do checkout foi implementada: a chave e a intenção são
preservadas no navegador durante uma tentativa; o PostgreSQL registra o hash
e a resposta por cliente e chave na mesma transação do pedido. Requisições
concorrentes aguardam o bloqueio do cliente, e uma tentativa com conteúdo
diferente recebe 409. A assinatura do carrinho impede comprar itens alterados
quando a primeira requisição não chegou ao servidor. A API de checkout agora
exige o cabeçalho `Idempotency-Key` e o campo `cartSignature`; clientes antigos
precisam ser atualizados em conjunto com o backend.

Os registros e as respostas são mantidos sem expiração automática por enquanto:
definir retenção, privacidade e reconciliação antes de removê-los, pois a
remoção prematura permitiria repetir uma compra. A autorização de pagamento é
simulada localmente, sem PSP externo. Caso a decisão mude no futuro, será
necessário implementar a intenção e a chave idempotente no provedor.

O pagamento fictício local, o outbox e a fila Redis Streams foram
implementados. O consumidor registra notificações internas de pagamento, com
deduplicação no PostgreSQL, recuperação de mensagens pendentes, republicação e
retries limitados. Falhas permanentes ficam registradas no banco. O resultado
não envia e-mails; esse efeito depende de uma integração posterior.

A P1.1 foi corrigida: o gráfico de vendas por categoria inclui pedidos
aprovados, em trânsito e entregues. O teste PostgreSQL cobre os status,
limites de data e rateio do desconto. Seguir para as demais pendências P1 e
para o cache medido, preservando as decisões de retenção e operação da fila.

A P1.2 possui auditoria transacional no PostgreSQL para as tabelas existentes:
inserções, alterações e exclusões registram ator, horário, campos alterados e
valores permitidos. Senhas, identificadores de pagamento, conversas e outros
campos sensíveis são ocultados. Operações autenticadas são atribuídas à conta;
processos internos e acessos diretos ao banco têm identificações distintas.
Cada nova tabela de domínio deve receber o gatilho `audit_write` em sua
migração. Antes da produção, definir retenção e acesso restrito aos logs e
usar papéis de banco separados; não apagar automaticamente o histórico antes
de estabelecer a política aplicável. O custo de escrita e armazenamento deve
ser medido com carga representativa.

A P1.3 separou o acesso ao modelo, a persistência do histórico e o ranking do
orquestrador do chat. A leitura de contexto e a gravação usam transações
curtas; a chamada externa ocorre fora delas. Produtos do histórico são
buscados em lote, e versões impedem respostas ou sugestões em andamento de
restaurarem dados após limpeza ou mudança de preferências. O fluxo foi validado
pela interface usando um modelo local de teste e PostgreSQL isolado.

A P1.4 separou cálculo de cupons e ciclo de reservas. O agendador consulta
apenas reservas vencidas ou próximas do aviso e processa até 100 clientes por
vez, em transações independentes; a liberação administrativa continua
transacional. A renovação de prazo volta a habilitar o aviso de vencimento.
Os testes cobrem reservas concorrentes, reconciliação e notificações.

A P1.5 serializou as transições e impede solicitações sobrepostas de item e
compra inteira. A compra inteira reflete a evolução da troca; uma negativa
restaura o estado de entrega. O cliente pode escolher a variação, e o painel
mostra o item selecionado. Concorrência, emissão única de cupom e reentrada
de estoque foram testadas no PostgreSQL; os dois fluxos também passaram pela
interface e pelos cenários Cypress focados. O DRS não exige entrada de código
de rastreio pelo cliente; o endpoint existente foi preservado.

A P1.6 migrou a tela pública de catálogo para busca paginada no PostgreSQL,
com filtros por texto e categoria e busca sem diferenciar acentos. A carga
inicial é limitada; detalhes, carrinho e recomendações buscam produtos sob
demanda. Overview e produtos mais vendidos são agregados no banco, preservando
as regras anteriores. Os índices para ordenação dos produtos ativos e busca de
itens por pedido foram medidos com 100 mil linhas sintéticas em tabelas
temporárias, além de testes com PostgreSQL e fluxo Cypress de paginação e
carrinho. São medições locais, não uma previsão de produção. A rota antiga
sem paginação e o catálogo administrativo continuam disponíveis por
compatibilidade e ainda carregam listas completas: migrar seus consumidores e
removê-los em lote posterior. Busca por substring ainda pode percorrer a tabela;
medir com dados reais antes de introduzir extensões ou índices adicionais.

Na primeira P2, os dados de catálogo, cupons e avaliações foram separados do
orquestrador de demonstração; a preparação de clientes, cartões e pedidos está
em serviço próprio, ainda dentro da transação do seed. Um teste no PostgreSQL
executa o seed duas vezes e verifica SKUs e ausência de duplicação de pedidos e
cupons. Os dados usados nesse teste são revertidos ao final.

Na P2 de clientes e estoque, as operações de endereço têm serviço e
transações próprias, e cadastro e alteração compartilham a regra de senha.
A atualização administrativa de estoque foi separada e bloqueia a variação,
como o checkout. A suíte backend, 34 testes de integração PostgreSQL/Redis e
o fluxo de checkout com novo endereço e cartão passaram.

O primeiro cache Redis cobre categorias públicas, com instância independente,
TTL de 60–75 segundos, limite de valor, timeout curto, fallback ao PostgreSQL e
invalidação após commit. Uma versão no Redis impede que um preenchimento antigo
sobrescreva uma invalidação de outra instância. Foi usado um adaptador explícito
em vez de anotações Spring Cache para garantir essa proteção; o agrupamento de
preenchimentos ocorre por processo, ainda não entre réplicas. Se a invalidação
falhar, a atualização pode demorar até o TTL. Testes cobrem indisponibilidade,
concorrência, commit e rollback, e a criação foi conferida pela UI. Medir uso e
custo reais antes de cachear catálogo adicional ou analytics.

O processamento de imagens está em implementação: uploads podem usar MinIO ou
S3 privado, com tarefa durável no PostgreSQL, entrega pelo Redis Streams e
saída WebP em chave própria. A UI de criação e reabertura, repetição de evento,
falha e nova tentativa foram testadas em ambiente isolado. A limpeza periódica
foi coberta por teste focado; ainda é necessário validar recuperação de worker,
indisponibilidade dos serviços, substituição de imagem, operação e custos antes
de considerar o lote concluído.

Na P2 de sessão, a API distingue ausência de autenticação (401) de falta de
permissão (403). O cliente mantém a sessão no segundo caso e descarta respostas
que chegaram depois da troca da credencial; a recarga dos dados do cliente
confere novamente a conta antes de atualizar o estado. A migração de tokens
para sessões revogáveis com cookies ainda está pendente.

## Instruções para executar os lotes

1. Ler `AGENTS.md`, [DRS.md](DRS.md), skills de backend, frontend, validação,
   JUnit e fluxos UI conforme o lote. Conferir Git e preservar alterações do
   usuário. Trabalhar com configuração de teste documentada e credenciais
   exclusivas por ambiente. O `.env` da raiz é protegido.
2. Inventariar rotas, payloads, erros, estados de pedidos e testes antes de
   mover código. Registrar o comportamento esperado e divergências do DRS.
   Fixar regressões de domínio com testes direcionados. Usar PostgreSQL real
   para locks, índices, outbox e SQL nativo.
3. Começar pelos bloqueadores de segurança e checkout. Preservar fachada e
   DTOs enquanto extrai lógica. Revisar chamadas internas a métodos
   `@Transactional`; definir as transações em fronteiras interceptadas pelo
   Spring ou usar `TransactionTemplate`. Garantir locks em ordem consistente
   e transições condicionais ou bloqueadas antes dos efeitos.
4. Evoluir idempotência e outbox em lotes separados. Manter o pagamento local
   simulado. Adicionar imagens S3 em lote independente. Refatorar chat,
   catálogo, clientes, analytics e frontend por fluxo. Medir antes de ligar
   cache. Usar migrações Flyway novas e compatíveis com versões anteriores.
5. Por lote, executar verificações proporcionais conforme as skills.
   Exercitar fluxos reais pela UI em staging e usar API apenas para preparar
   dados repetitivos. Registrar arquivos, comportamento preservado,
   divergências corrigidas e limitações. Um build sozinho não valida o fluxo.

## Idempotência e pagamentos

- Começar em checkout. O frontend gera uma chave aleatória por tentativa
  lógica e a reaproveita após timeout, inclusive se precisar consultar
  novamente o pedido. Alterar a intenção gera outra chave. Autorizar a
  chave por ator e operação. Em origens distintas, permitir
  `Idempotency-Key` no CORS.
- PostgreSQL com índice único por ator, operação e chave, hash canônico do
  pedido e referência ao resultado. Mesma chave e hash devolvem o resultado
  anterior. Hash diferente recebe 409. Operação em andamento tem resposta
  definida e consultável. Resolver disputa atômica no banco, inclusive duas
  chaves distintas sobre o mesmo carrinho, usando invariantes de negócio.
- Caso um PSP real seja adotado no futuro, confirmar pedido pendente e
  intenção de pagamento antes de chamá-lo.
  Persistir chave externa estável e resultado com transação curta separada.
  Em timeout ambíguo, reconciliar a mesma intenção no PSP antes de tentar
  outra cobrança. Webhook verifica assinatura, deduplica ID do evento e
  aplica somente transições válidas. Definir reserva, vencimento e estorno
  quando pagamento e estoque divergirem.
- Aplicar a operações que geram efeitos únicos, como conclusão de troca,
  emissão de cupom e reembolso. Definir retenção por janela de retry e
  reconciliação. Guardar referências e metadados mínimos, sem dados de cartão.

## Fila durável

Usar Redis Streams com grupos de consumidores. O PostgreSQL mantém o outbox
gravado junto à mudança de negócio e o registro durável de conclusão. Um
publicador envia ao Stream com ID de evento estável no payload. Publicações
repetidas são esperadas se houver falha entre envio e atualização do outbox.
Manter eventos recuperáveis e republicar os que ficaram sem conclusão após
uma janela definida, inclusive após perda do Stream.

O worker lê em lotes, confirma com `XACK` após sucesso registrado e recupera
mensagens pendentes de workers interrompidos com `XAUTOCLAIM`. Controlar retries
com backoff e jitter, separar falhas permanentes para reprocessamento e manter
deduplicação por evento e consumidor no PostgreSQL. Para efeitos externos,
usar a chave idempotente do provedor quando houver suporte. Definir retenção
do Stream que preserve mensagens pendentes e possibilidade de replay.
Medir atraso, pendências, retries e falhas. Começar com e-mail de pedido e
executor limitado junto da API. Separar processo quando a carga justificar.
[Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)

## Cache e sessão

Usar Redis com Spring Cache em leituras públicas repetidas. Começar por
categorias e metadados de catálogo. Avaliar agregações caras de analytics
depois de medir SQL, índices, p95 e cardinalidade dos filtros. Se houver
cache de analytics, autorizar antes de acessar e incluir na chave todo
escopo de acesso e filtros normalizados. Usar cache-aside, namespace por
ambiente e versão, TTL curto com jitter e invalidação após commit. Limitar
tamanho dos valores e evitar cachear combinações pouco reutilizadas.
Coalescer preenchimentos concorrentes de chaves quentes e proteger o banco
com timeout curto e fallback limitado se Redis falhar.

Preço final, disponibilidade, estoque, cupons e pagamento são decididos no
PostgreSQL. Respostas privadas ficam fora do cache HTTP compartilhado.
Imagens versionadas e assets continuam no cache HTTP/CDN.

Separar cache e fila em instâncias Redis em produção. Cache pode usar
`allkeys-lfu`; fila usa `noeviction`, persistência disponível no provedor e
alertas de memória. Bancos lógicos na mesma instância compartilham memória
e política de expulsão. Se a fila recusar uma escrita, manter o evento
pendente no outbox. No Compose, subir duas instâncias pequenas com essas
políticas e volume para a fila. Em produção, dimensionar cada instância
pela memória e pelo tráfego medidos. Acompanhar hit rate, evictions, latência,
memória, comandos por mês, bytes e carga do PostgreSQL antes e depois.
[Políticas de expulsão do Redis](https://redis.io/docs/latest/develop/reference/eviction/)

JWT é uma credencial assinada enviada pelo cliente. Hoje a API é stateless,
com validade de 30 dias e tokens no armazenamento do navegador. Manter
autenticação sem Redis como padrão. Se for necessário renovar, revogar e
gerenciar sessões por dispositivo, usar access token curto e refresh token
rotativo com hash e revogação no PostgreSQL. Avaliar cookie HttpOnly,
Secure e SameSite no refresh, com proteção CSRF e configuração por origem.
Testar expiração, troca de conta, logout e mudanças de permissão.

## Armazenamento de imagens

- O formulário de criação e edição já permite selecionar uma imagem e faz o
  upload antes de salvar o produto. Evoluir esse fluxo para que o envio na
  criação continue simples e o processamento aconteça em segundo plano.
- Após validar o arquivo recebido, salvá-lo em área temporária privada do
  armazenamento de objetos e registrar a tarefa de processamento de forma
  durável. O worker da fila deve decodificar a imagem com limites de tamanho
  e dimensões, corrigir orientação, redimensionar quando necessário e gerar
  WebP compactado, preservando proporção e transparência quando aplicável.
  Definir limites e qualidade com amostras reais de produtos.
- Publicar a imagem processada somente após o upload do WebP ser concluído.
  Manter o produto utilizável enquanto a imagem está pendente e mostrar no
  formulário estados simples de processamento e erro, com opção de tentar
  novamente. Evitar que uma tarefa antiga sobrescreva uma imagem mais recente
  se o administrador trocar o arquivo durante o processamento.
- Tornar o processamento idempotente e seguro para retries. Registrar
  falhas permanentes, limpar arquivos temporários e resultados órfãos após
  uma janela de recuperação e evitar duplicar objetos em reprocessamentos.
  Validar criação, edição, substituição, arquivos inválidos, interrupção do
  worker, repetição da mensagem e persistência após deploy pela UI e por
  testes de integração em ambiente isolado.
- Dev com MinIO via Compose, staging com bucket e credenciais isolados, prod
  com S3 e CloudFront ou R2 com domínio próprio. Escolher uma API compatível
  e verificar as operações realmente usadas nos dois ambientes. Manter
  adaptador local temporário para leitura das imagens existentes.
- Manter contrato de upload do admin inicialmente. Validar tamanho, tipo pelo
  conteúdo e dimensões. Usar chaves geradas e guardar referência estável no
  PostgreSQL. Credenciais somente no backend, com privilégios por bucket.
  Publicar apenas imagens de catálogo. Usar chaves novas a cada versão para
  cache imutável. Para falha parcial, distinguir uploads pendentes dos
  referenciados e limpar órfãos com janela de recuperação e verificação.
- Inventariar uploads e assets estáticos, copiar e verificar integridade antes
  de trocar referências. Manter fallback durante a transição e documentar
  rollback. Testar substituição de imagem e persistência após novo deploy.

## Produção e custo

Manter o monólito Spring Boot com PostgreSQL gerenciado, frontend estático
em CDN e armazenamento de objetos. API e banco na mesma região. Comparar um
piloto em plataforma gerenciada com AWS São Paulo medindo latência desde o
Brasil. Tratar configuração e imagens de produção como artefatos separados
do Compose de desenvolvimento, que usa Vite e Maven em execução.

Para cotar, somar compute sempre ativo, worker se separado, armazenamento
do banco e backups, imagens e operações, tráfego, CDN, logs, rede
(load balancer, NAT e IPs quando necessários), domínio, IA e PSP. Simular
piloto com duas instâncias pequenas de Redis e worker junto da API.
Comparar com execução em worker dedicado e planos maiores. Cotar cache e
fila separadamente, incluindo política de memória, persistência e tráfego. O plano anterior
registrava US$ 51–104/mês para Render com worker separado e opções de Redis
em 22/11/2026. Esse valor é referência histórica. Montar orçamento atualizado
antes de contratar. [Render](https://render.com/pricing) ·
[R2](https://developers.cloudflare.com/r2/pricing/) ·
[AWS Pricing Calculator](https://calculator.aws/)

Preparar imagens OCI com build em estágios e runtime sem Maven, CI com
Checkstyle/build e validação de migrações, TLS, CORS por ambiente, secrets do
provedor, readiness e shutdown gracioso. Configurar alertas de erro,
latência, DB, fila e consumo de IA, limites de gasto, backups e restauração
ensaiada. Revisar retenção de conversas e dados enviados ao modelo, logs sem
credenciais, auditoria do DRS e possibilidade de desligar IA sem afetar loja.

## Aceite antes de cobrança real

- Seed indisponível em produção. Staging isolado e rollback ensaiado.
- Checkout repetido ou concorrente gera no máximo um pedido e uma cobrança
  por intenção. Rejeição, timeout e webhook duplicado preservam consistência.
- Retry de fila e interrupção no meio de uma tarefa não duplicam efeitos
  cobertos por deduplicação. Falhas permanentes ficam visíveis.
- Imagens sobrevivem a troca de instância e deploy. Backup foi restaurado.
- Catálogo, login, troca de conta, checkout, devolução e chat validados pela
  UI. Conferir RNF0011 com carga representativa e RNF0012 nas escritas.
- Orçamento registrado com limites e critérios observáveis para escalar.
