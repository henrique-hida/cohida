---
name: cohida-fluxos-ui
description: Validar fluxos reais do Cohida pela interface usando Playwright MCP ou manter cenários Cypress existentes.
---

# Fluxos pela interface

Defina o comportamento e as evidências esperadas antes do teste. Consulte `AGENTS.md` e use dados de teste. Considere os efeitos em banco e serviços; não remova dados, volumes ou contas sem autorização.

- Em fluxos reais, realize as ações e confirme resultados pela interface. API pode preparar dados repetitivos, mas não comprova o resultado visível nem substitui a interação testada.
- Use Playwright MCP para inspeção e exploração interativa quando disponível; use os testes Cypress existentes para regressões automatizadas. Não migre a suíte entre ferramentas sem solicitação.
- Escolha seletores acessíveis e estáveis, aguarde estados observáveis e evite esperas arbitrárias. Verifique erros, carregamento, teclado ou tamanhos de tela quando forem relevantes.
- Confira `cohida-frontend/cypress.config.ts`, a spec e seus helpers. A suíte `npm run cy:run` inicia Vite na porta 5174; execute o caso focado antes de ampliar. O preparo de analytics altera dados no PostgreSQL: confira seu escopo antes de executá-lo.
- Diferencie resultados com respostas simuladas dos observados com backend e persistência reais. Registre bloqueios de ambiente e os passos efetivamente observados. Evite expor tokens e dados sensíveis em capturas e logs.
