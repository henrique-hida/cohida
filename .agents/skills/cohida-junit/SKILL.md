---
name: cohida-junit
description: Criar ou revisar testes JUnit para regras e integrações do backend Spring Boot do Cohida.
---

# Testes Java do Cohida

Inspecione a regra de negócio, testes próximos e configuração antes de escolher o nível de teste. Use JUnit e ferramentas já presentes; adicione dependências somente quando houver necessidade concreta.

- Cubra comportamento observável, limites relevantes e falhas importantes; não replique a implementação nem teste detalhes internos apenas para aumentar cobertura.
- Use testes unitários para regras isoladas e integração quando a interação entre camadas, segurança, transações ou persistência for relevante. Mocks devem representar dependências externas, sem simular o comportamento que o teste precisa provar.
- Mantenha cenários independentes, dados explícitos e nomes que descrevam condição e resultado. Evite rede externa e credenciais reais; não altere dados persistentes sem compreender o alcance.
- Cada teste deve preparar os próprios dados, verificá-los e deixá-los limpos, sem depender da ordem, de IDs fixos ou de dados criados por outros testes. Em testes de integração, use rollback transacional quando cobrir todas as escritas; para escritas fora dessa transação, faça a limpeza explícita em ambiente de teste isolado.
- Execute primeiro `./mvnw -Dtest=NomeDoTeste test` em `cohida-backend`; amplie a execução quando a alteração ou o risco justificar. Informe quais cenários foram simulados e quais integrações foram realmente exercitadas.
- Siga as regras de formatação e os limites de escopo descritos em `cohida-backend` e `AGENTS.md`.
