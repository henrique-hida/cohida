# Como funciona o chatbot

Este documento descreve o código atual do assistente da coHida e a lista de
recomendações da página inicial. O chatbot usa Spring AI e OpenRouter; os dados
do cliente e o histórico ficam no banco da aplicação.

## 1. Acesso e preferências

1. O visitante abre o assistente pelo botão no canto da loja. Para conversar,
   precisa entrar em uma conta de cliente.
2. Pelo botão de preferências, o cliente escolhe uma ou mais atividades:
   corrida, futebol, judô, treino, trilha e vôlei.
3. Para cada atividade, pode escolher um interesse específico, como tênis para
   corrida ou bolas para futebol. Atualmente é salvo **um interesse por
   atividade**.
4. Também pode responder nível de experiência, objetivo e faixa de preço, ou
   pular essas perguntas. Cada campo aceita uma opção.
5. As respostas são validadas e salvas por cliente. É possível alterá-las pelo
   ícone de lápis; a próxima conversa utiliza os valores salvos.

O perfil é opcional: o cliente pode fazer perguntas sem preencher tudo.

## 2. Perguntas sugeridas

Ao abrir o chat, a interface pede sugestões baseadas na primeira atividade
salva em ordem alfabética. Elas vêm de listas prontas no backend, sem uma nova
chamada à IA. Se não houver sugestões, a interface mostra perguntas gerais.
Ao clicar em uma delas, ela é enviada como uma pergunta normal.

Existe também uma API separada que gera sugestões com IA a partir do campo
legado de preferências em texto. Ela usa listas prontas se a geração falhar;
**não é o fluxo de sugestões exibido pelo chat atual**.

## 3. O que acontece ao enviar uma mensagem

1. O frontend mostra a pergunta e envia o texto ao backend. O limite é de
   **2.000 caracteres**; mensagens vazias são recusadas.
2. O backend identifica o cliente autenticado e reúne o contexto:
   - atividades e interesses confirmados, experiência, objetivo e orçamento;
   - itens dos até 30 pedidos mais recentes com status aprovado, em trânsito
     ou entregue, limitados a 60 descrições distintas;
   - até 100 produtos ativos com estoque, priorizados por correspondência de
     palavras da pergunta e do perfil com nome e categorias;
   - as últimas 10 perguntas e respostas salvas, incluindo suas avaliações.
3. O backend monta instruções para responder em português, usar o catálogo
   fornecido, não inventar dados e priorizar a pergunta atual. A mensagem, o
   contexto e o catálogo selecionado são enviados ao provedor externo.
4. O Spring AI solicita ao OpenRouter uma resposta estruturada em JSON, com
   `content` para o texto e `productSlugs` para os produtos. A requisição
   exige um provedor que aceite os parâmetros, solicita modo estrito e limita
   a geração a 600 tokens, com orçamento de raciocínio de 128 tokens.
5. O backend valida o texto e os identificadores. Só transforma em cartões
   produtos presentes no catálogo enviado, sem repetição e até 10 por resposta.
   Os preços dos cartões vêm do catálogo, usando o menor preço de variante com
   estoque. O texto da IA não passa por uma checagem completa de fatos.
6. Pergunta, resposta, modelo e produtos associados são gravados no banco. A
   resposta e os cartões aparecem no chat; um cartão abre a página do produto.

A chamada à IA ocorre fora da transação de banco. Se a conversa for apagada
enquanto a resposta estiver sendo gerada, o backend evita salvá-la novamente.

## 4. Histórico, erros e avaliações

- **Histórico:** ao abrir o chat, a aplicação recupera até as últimas 50
  interações salvas. As últimas 10 são incluídas no contexto da próxima
  pergunta. Os cartões exibidos novamente dependem dos produtos ainda estarem
  ativos e disponíveis.
- **Limpar conversa:** apaga as interações e suas avaliações. As preferências
  e os interesses do cliente permanecem.
- **Falha:** o backend tenta a geração até duas vezes. Se não conseguir, o
  chat mostra a falha e permite tentar novamente. Falhas externas, limites do
  provedor e respostas inadequadas ainda podem ocorrer.
- **Resposta útil:** o cliente pode avaliar cada resposta como útil ou não.
  A avaliação fica associada àquela resposta e pode ser alterada. Nas próximas
  mensagens, as avaliações das interações recentes são incluídas como sinais
  para a IA, sem serem tratadas como preferência explícita.
- **Novo interesse:** se a pergunta contiver certos termos, como “quero” ou
  “pratico”, junto de uma atividade reconhecida ainda não salva, o chat pode
  oferecer adicioná-la. Ela só entra no perfil após confirmação do cliente.

## 5. Primeira lista de produtos da home

Essa lista usa um **algoritmo local**, sem uma chamada à IA para cada visita.
Para um cliente autenticado, o backend considera produtos ativos com estoque e
atribui pontos:

| Sinal | Pontos |
| --- | ---: |
| Nome ou categoria corresponde a uma atividade salva | +10 |
| Nome ou categoria corresponde a um interesse específico salvo | +2 |
| Categoria aparece em compras aprovadas, em trânsito ou entregues | +4 |
| Avaliação mais recente de resposta que indicou o produto | +1 se útil; −1 se não útil |

O algoritmo retorna até 10 produtos. Por exemplo, um tênis de corrida pode
somar 10 pontos pela atividade corrida, 2 pelo interesse em tênis e 4 se a
categoria já apareceu em uma compra elegível. Esses sinais dependem da
correspondência dos nomes e categorias; não há garantia de relevância.

Sem sessão de cliente ou enquanto as recomendações não estiverem disponíveis,
a home usa os produtos disponíveis no estado do frontend. A lista também é
atualizada quando a interface informa uma mudança de preferências ou avaliação.

## 6. Proteções e limites

- As rotas do chat exigem autenticação e perfil de cliente; as consultas e
  alterações são associadas ao cliente autenticado.
- As instruções dizem ao modelo para tratar dados do cliente, catálogo e
  conversa como dados e ignorar tentativas de mudar as regras. Isso reduz o
  risco de injeção de prompt, mas não o elimina.
- O schema e a validação dos produtos reduzem erros de formato e cartões
  inválidos. Eles não garantem que o texto seja correto ou que a IA esteja
  disponível em todas as chamadas.
- Preferências, compras, histórico recente e dados do catálogo são enviados ao
  provedor para gerar a resposta. A política de dados do modelo e do provedor
  configurados deve ser considerada antes do uso com clientes reais.
- O modelo depende da configuração `OPENROUTER_MODEL`; o padrão do projeto é
  `openrouter/free`. A chave vem de `OPENROUTER_API_KEY` e não deve ser exposta.
- A persistência do chat é no banco da aplicação; o cache Redis de categorias
  não guarda essas conversas.

## 7. Onde encontrar cada parte

| Parte | Arquivo |
| --- | --- |
| Janela, mensagens e ações do chat | `cohida-frontend/src/components/shared/ChatbotFab.tsx` e `chat/useChat.ts` |
| Perguntas e edição de preferências | `cohida-frontend/src/components/shared/chat/ChatProfile.tsx` |
| Lista de recomendações da home | `cohida-frontend/src/pages/storefront/HomePage.tsx` |
| Rotas e identificação do cliente | `cohida-backend/src/main/java/com/hida/cohida/chat/ChatController.java` |
| Contexto, perfil e fluxo da resposta | `cohida-backend/src/main/java/com/hida/cohida/chat/ChatService.java` |
| Chamada ao modelo, schema e tentativas | `cohida-backend/src/main/java/com/hida/cohida/chat/ChatModelGateway.java` |
| Persistência e limpeza do histórico | `cohida-backend/src/main/java/com/hida/cohida/chat/ChatHistoryStore.java` |
| Pontuação dos produtos da home | `cohida-backend/src/main/java/com/hida/cohida/chat/ChatRecommendations.java` |

Todas as rotas do controlador usam o prefixo `/api/customers/me/chat`: perfil
em `/profile`, interesses em `/interests`, mensagens em `/messages`, avaliação
em `/messages/{id}/feedback`, sugestões da interface em `/profile-suggestions`
e recomendações da home em `/recommendations`.
