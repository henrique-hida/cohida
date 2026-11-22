---
name: cohida-validacao
description: Escolher e relatar validações proporcionais às alterações no Cohida, incluindo build, lint e testes focados.
---

# Validação no Cohida

Confira o Git, as instruções em `AGENTS.md` e os testes afetados. Escolha verificações proporcionais ao risco e preserve alterações existentes.

- Frontend (`cohida-frontend`): para alterações relevantes, execute `npm run build` e `npm run lint`. O lint inclui a conferência de formatação. Distinga falhas preexistentes das causadas pela mudança sem escondê-las.
- Backend (`cohida-backend`): execute os testes relevantes conforme `cohida-junit` e `./mvnw checkstyle:check`; confira migrações e contratos quando afetados. Relate violações preexistentes.
- Para fluxos de interface reais ou Cypress, siga `cohida-fluxos-ui`. Uma alteração visual ou interativa deve ser inspecionada nas telas e larguras afetadas quando possível.
- Para Docker e serviços locais, siga a orientação de sandbox em `AGENTS.md`. Não leia o `.env` da raiz, não revele credenciais e não apague dados ou volumes sem autorização.

Informe comandos, resultados e limitações. Build, mocks e chamadas de API não provam um fluxo real pela interface.
