## Trabalho no projeto

- Não leia nem exponha o arquivo `.env` da raiz ou credenciais; use `.env.example` e dados de teste. Não contorne a proteção por shell, MCP ou execução fora da sandbox.
- Preserve alterações existentes e limite mudanças ao pedido. Confira o estado do Git antes de editar.
- Oriente-se pelo código atual e pelos requisitos abaixo; relate divergências e diferencie testes simulados de fluxos reais.
- Prefira JPA/Hibernate e repositórios Spring Data para persistência e consultas comuns. Use SQL específico quando necessário para recursos do banco, concorrência ou desempenho, mantendo-o concentrado na camada de persistência.
- Para validação de mudanças e fluxos de interface, consulte `.agents/skills/cohida-validacao/SKILL.md`.
- Docker e serviços locais podem falhar dentro da sandbox. Quando necessário e permitido, repita a verificação no host com o menor escopo; informe limitações.

## Validação proporcional

- Execute uma vez as verificações aplicáveis à mudança, incluindo build, lint e testes focados conforme a skill de validação.
- Em alterações de interface, inspecione a tela e a interação afetadas nas larguras relevantes, sem repetir fluxos já confirmados.
- Amplie ou repita verificações somente quando houver falha, alteração posterior ou dúvida concreta que justifique isso.
- Se uma verificação depender de autorização ou estiver bloqueada, informe a pendência e não crie uma sequência de testes alternativos apenas para compensá-la.

## Testes de fluxo

- Em todo teste de fluxo real deste projeto, realize as interações e verificações do comportamento pela interface (UI).
- Utilize a API somente para preparar dados repetitivos necessários ao teste. Não use respostas da API para substituir a verificação do fluxo pela interface.

## Requisitos do projeto

- Consulte [docs/DRS.md](docs/DRS.md) para os requisitos aplicáveis à tarefa. O DRS é a referência normativa desta entrega.
