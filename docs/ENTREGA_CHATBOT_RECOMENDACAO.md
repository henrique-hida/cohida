# Entrega — Chatbot de recomendação personalizada

## 1. Objetivo

Implementar um chatbot de recomendação personalizada de artigos esportivos para o e-commerce coHida, integrado a uma IA generativa. A implementação deve atender ao requisito do DRS e ser rastreável a ele. A funcionalidade será testada presencialmente pelo professor durante a apresentação.

O enunciado original utiliza livros como exemplo; nesta entrega, o domínio considerado é o de artigos esportivos, conforme o DRS do projeto.

## 2. Requisito contemplado

**RNF0044 — Recomendação com IA Generativa**

1. O sistema deve integrar uma IA generativa para oferecer recomendações personalizadas de artigos esportivos aos clientes com base no histórico de compras e preferências.
2. A IA deve permitir a interação via chatbot para auxiliar na busca por artigos esportivos, responder dúvidas e sugerir conteúdos relevantes.
3. O sistema deve permitir que os clientes avaliem as respostas do chatbot e registrar essas avaliações.

## 3. Critérios da atividade

- O chatbot é utilizado pelo perfil cliente.
- A IA generativa é de livre escolha do grupo, que deve justificar a escolha.
- O feedback é obtido pela avaliação das respostas no próprio chat, por exemplo, como útil ou não útil.
- O DRS não define como as preferências do cliente são obtidas. O grupo deve decidir, documentar e justificar essa escolha.

## 4. Funcionalidades a implementar

| Item | Funcionalidade | Rastreabilidade |
| --- | --- | --- |
| a | Integrar o sistema à IA generativa escolhida. | RNF0044, item 1 |
| b | Recomendar artigos esportivos de forma personalizada com base no histórico de compras e nas preferências do cliente. | RNF0044, item 1 |
| c | Disponibilizar um chatbot para ajudar na busca por artigos esportivos, responder dúvidas e sugerir conteúdos relevantes. | RNF0044, item 2 |
| d | Permitir que o cliente avalie cada resposta do chatbot e registrar o feedback. | RNF0044, item 3 |

## 5. Massa de dados para teste

O sistema deve conter pelo menos dois clientes com históricos de compras distintos, além de avaliações registradas para demonstrar o feedback.

## 6. Fora do escopo

Integração com outros canais de atendimento. A primeira lista de produtos da
página inicial também pode apresentar recomendações personalizadas, com base
nas preferências confirmadas e no histórico de compras.

## 7. Apresentação presencial

O professor testará a funcionalidade ao vivo. O sistema deve estar em execução e preparado para uso, sem depender de ajustes durante a apresentação. Além de fazer perguntas livres ao chatbot, o professor poderá verificar os seguintes cenários:

1. Demonstração da integração com a IA generativa escolhida e justificativa da escolha.
2. Recomendação personalizada para um cliente, coerente com seu histórico de compras e preferências.
3. Recomendações diferentes para dois clientes com históricos distintos.
4. Ajuda na busca por artigos esportivos pelo chat.
5. Respostas a dúvidas sobre artigos esportivos feitas pelo professor.
6. Sugestão de conteúdos relevantes pelo chatbot.
7. Avaliação de uma resposta como útil ou não útil, com demonstração do feedback registrado.

As interações e verificações dos fluxos reais devem ser realizadas pela interface. A API pode ser utilizada para preparar dados repetitivos necessários ao teste, sem substituir a verificação pela interface.
