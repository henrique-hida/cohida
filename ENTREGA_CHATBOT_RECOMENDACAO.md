# Entrega — Chatbot de recomendação personalizada

## 1. Objetivo

Implementar um chatbot de recomendação personalizada de artigos esportivos para o e-commerce coHida, integrado a uma IA generativa. A implementação deve atender ao requisito do DRS e ser rastreável a ele. A funcionalidade será testada presencialmente pelo professor durante a apresentação.

O enunciado original utiliza livros como exemplo; nesta entrega, o domínio considerado é o de artigos esportivos, conforme o DRS do projeto.

## 2. Requisito contemplado

**RNF0044 — Recomendação com IA Generativa**

1. O sistema deve integrar uma IA generativa para oferecer recomendações personalizadas de artigos esportivos aos clientes com base no histórico de compras e preferências.
2. A IA deve permitir a interação via chatbot para auxiliar na busca por artigos esportivos, responder dúvidas e sugerir conteúdos relevantes.
3. O modelo de IA deve ser treinado com base em dados de vendas e feedback dos usuários, garantindo personalização contínua.

## 3. Critérios da atividade

- O chatbot é utilizado pelo perfil cliente.
- A IA generativa é de livre escolha do grupo, que deve justificar a escolha.
- O modelo deve passar por treinamento ou ajuste fino com dados de vendas e feedback dos usuários. Enviar esses dados apenas como contexto das perguntas não atende ao critério.
- O feedback é obtido pela avaliação das respostas no próprio chat, por exemplo, como útil ou não útil.
- O DRS não define como as preferências do cliente são obtidas. O grupo deve decidir, documentar e justificar essa escolha.

## 4. Funcionalidades a implementar

| Item | Funcionalidade | Rastreabilidade |
| --- | --- | --- |
| a | Integrar o sistema à IA generativa escolhida. | RNF0044, item 1 |
| b | Recomendar artigos esportivos de forma personalizada com base no histórico de compras e nas preferências do cliente. | RNF0044, item 1 |
| c | Disponibilizar um chatbot para ajudar na busca por artigos esportivos, responder dúvidas e sugerir conteúdos relevantes. | RNF0044, item 2 |
| d | Permitir que o cliente avalie cada resposta do chatbot e registrar o feedback. | RNF0044, item 3 |
| e | Treinar ou ajustar o modelo com dados de vendas e feedback registrado, incorporando novos dados continuamente. | RNF0044, item 3 |

## 5. Massa de dados para teste

O sistema deve conter pelo menos dois clientes com históricos de compras distintos, além de vendas e feedback registrados em quantidade suficiente para o treinamento ou ajuste fino realizado.

## 6. Fora do escopo

Funcionalidades não previstas no DRS, como recomendações fora do chat e integração com outros canais de atendimento.

## 7. Apresentação presencial

O professor testará a funcionalidade ao vivo. O sistema deve estar em execução e preparado para uso, sem depender de ajustes durante a apresentação. Além de fazer perguntas livres ao chatbot, o professor poderá verificar os seguintes cenários:

1. Demonstração da integração com a IA generativa escolhida e justificativa da escolha.
2. Recomendação personalizada para um cliente, coerente com seu histórico de compras e preferências.
3. Recomendações diferentes para dois clientes com históricos distintos.
4. Ajuda na busca por artigos esportivos pelo chat.
5. Respostas a dúvidas sobre artigos esportivos feitas pelo professor.
6. Sugestão de conteúdos relevantes pelo chatbot.
7. Avaliação de uma resposta como útil ou não útil, com demonstração do feedback registrado.
8. Apresentação do treinamento ou ajuste fino: dados utilizados, procedimento realizado e como novos dados de vendas e feedback são incorporados ao modelo.

As interações e verificações dos fluxos reais devem ser realizadas pela interface. A API pode ser utilizada para preparar dados repetitivos necessários ao teste, sem substituir a verificação pela interface.
