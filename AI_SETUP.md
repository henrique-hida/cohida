# Configuração dos assistentes

Abra a raiz do repositório como workspace. `AGENTS.md` contém as regras comuns e os requisitos; a skill `.agents/skills/cohida-validacao/SKILL.md` orienta a escolha das validações. `CLAUDE.md` aponta para essas mesmas instruções no Claude Code.

As skills `cohida-frontend`, `cohida-backend`, `cohida-fluxos-ui` e `cohida-junit` detalham os respectivos fluxos. No frontend, `npm run lint` executa ESLint e a verificação Prettier; `npm run format` altera todos os arquivos de `src`, portanto confira o escopo antes de usá-lo. No backend, `./mvnw checkstyle:check` confere código Java de produção e testes. O Checkstyle é executado explicitamente, sem bloquear o ciclo de testes enquanto o código existente não for adequadamente formatado. As verificações podem apontar problemas preexistentes até a refatoração.

O limite de 80 colunas é verificado pelo ESLint e pelo Checkstyle; `printWidth` do Prettier é uma meta de formatação e não garante esse limite. Java exige aspas duplas em strings. O `.editorconfig` comunica a indentação de dois espaços aos editores; o Checkstyle confere a indentação Java.

O Codex usa `.codex/config.toml`: o perfil `cohida` estende `:workspace` e bloqueia o `.env` na raiz do workspace. Abra uma nova sessão para carregar a configuração e confira o perfil ativo. Configurações de maior precedência, o modo de acesso irrestrito ou as opções antigas de sandbox podem substituir esse perfil. O bloqueio protege os comandos sujeitos à sandbox; servidores MCP e processos externos podem ter permissões próprias. Não use esses caminhos para acessar o arquivo.

No Claude Code, `.claude/settings.json` bloqueia `Read` e `Edit` do `.env` da raiz e permite as ferramentas do Playwright. Essas regras não constituem uma sandbox de sistema para todo comando ou servidor externo. Não leia o arquivo indiretamente. Use `.env.example` ou um ambiente de teste separado. O Docker Compose pode precisar do `.env` para iniciar; se a proteção impedir isso, informe a limitação e peça que o usuário inicie os serviços, sem contornar o bloqueio.

O Playwright MCP está configurado para os dois clientes, com versão fixada, Chrome e perfil isolado. O primeiro uso pode precisar de rede para baixar o pacote e do Chrome instalado. Reinicie a sessão após alterar a configuração; no Claude Code, pode ser necessário aprovar o servidor de projeto. `codex mcp list` e `/mcp` no Claude mostram seu estado, mas não substituem um teste de navegação.

Fontes: [perfis de permissões do Codex](https://learn.chatgpt.com/docs/permissions), [permissões do Claude Code](https://code.claude.com/docs/en/permissions) e [MCP no Claude Code](https://code.claude.com/docs/en/mcp).
