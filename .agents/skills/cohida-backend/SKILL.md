---
name: cohida-backend
description: Implementar ou refatorar regras de negócio, endpoints e persistência no backend Spring Boot do Cohida.
---

# Backend do Cohida

Leia o fluxo completo afetado, os requisitos pertinentes em `AGENTS.md`, contratos existentes e testes antes de editar. Preserve compatibilidade e dados; sinalize qualquer mudança de contrato necessária.

- Mantenha controllers focados em HTTP e validação de entrada; concentre regras de negócio em serviços coesos e persistência em repositórios. Use DTOs para limites da API e evite expor detalhes de persistência sem necessidade.
- Expresse regras com nomes claros, funções coesas, validações e erros específicos. Evite duplicação significativa, estados inválidos, código morto e abstrações desnecessárias. Prefira composição simples à complexidade incidental.
- Valide autorização no backend e trate limites transacionais, concorrência e integridade conforme o domínio. Nunca use nome de exibição ou estado de frontend como autorização.
- Para esquema, crie migrações Flyway incrementais e preserve migrações já aplicadas. Considere dados existentes e compatibilidade da API com o frontend.
- Use dois espaços e linhas de até 80 caracteres no Java novo ou alterado. Java exige aspas duplas para strings; aspas simples são para caracteres. Não reformate arquivos inteiros fora do escopo.
- Para testes Java, consulte `cohida-junit`; para a escolha e relato das demais verificações, consulte `cohida-validacao`.
