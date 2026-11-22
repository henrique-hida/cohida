## Trabalho no projeto

- Não leia nem exponha o arquivo `.env` da raiz ou credenciais; use `.env.example` e dados de teste. Não contorne a proteção por shell, MCP ou execução fora da sandbox.
- Preserve alterações existentes e limite mudanças ao pedido. Confira o estado do Git antes de editar.
- Oriente-se pelo código atual e pelos requisitos abaixo; relate divergências e diferencie testes simulados de fluxos reais.
- Para validação de mudanças e fluxos de interface, consulte `.agents/skills/cohida-validacao/SKILL.md`.
- Docker e serviços locais podem falhar dentro da sandbox. Quando necessário e permitido, repita a verificação no host com o menor escopo; informe limitações.

## Testes de fluxo

- Em todo teste de fluxo real deste projeto, realize as interações e verificações do comportamento pela interface (UI).
- Utilize a API somente para preparar dados repetitivos necessários ao teste. Não use respostas da API para substituir a verificação do fluxo pela interface.

## Requisitos do projeto

- Consulte [docs/DRS.md](docs/DRS.md) para os requisitos aplicáveis à tarefa. O DRS é a referência normativa desta entrega.
