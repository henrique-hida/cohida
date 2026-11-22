---
name: cohida-frontend
description: Implementar ou refatorar frontend React e TypeScript do Cohida com componentes legíveis, acessíveis e layouts compartilhados.
---

# Frontend do Cohida

Leia as rotas, componentes, contratos e estado envolvidos antes de editar. Preserve a experiência existente e as alterações de outras pessoas. Para padrões gerais e segurança, siga `AGENTS.md`.

- Organize o código por responsabilidade: páginas coordenam a tela, componentes apresentam e interagem, e acesso à API e regras reutilizáveis ficam fora da apresentação quando isso reduzir acoplamento. Evite abstrações para um único uso sem ganho claro.
- Dê nomes descritivos, mantenha funções pequenas e coesas, reduza aninhamento e duplicação significativa e remova código morto somente dentro do escopo solicitado. Prefira tipos explícitos nas fronteiras e evite `any`.
- Reutilize os componentes e tokens existentes. Estados de carregamento, vazio e erro devem ser compreensíveis; controles devem ser acessíveis por teclado e ter nomes acessíveis. Preserve responsividade.
- Para estrutura comum entre páginas, prefira layouts compartilhados e composição de rotas do React Router, como `Outlet`, quando adequados. Preserve cabeçalho, navegação, autenticação e estado entre rotas. Não introduza Inertia ou migração de layout sem solicitação.
- Siga `.editorconfig`, `.prettierrc.json` e ESLint: dois espaços, aspas simples em TypeScript/JavaScript e JSX e máximo de 80 caracteres por linha. Ajuste manualmente linhas que o formatador não consegue dividir sem mudar significado.
- Valide conforme `cohida-validacao`; mudanças visuais e interativas exigem inspeção nas telas e larguras afetadas quando o ambiente permitir.
