# Conductor Skills Catalog

This catalog is automatically maintained by the `/registerSkill` workflow. It registers all available skills in the `conductor/skills/` directory to ensure the AI agent can discover and recommend them.

## Available Skills

| Skill Name | Version | Description | Triggers | Path |
| :--- | :--- | :--- | :--- | :--- |
| **api-contract-modeling** | 1.0.0 | Modela e gera contratos de API (OpenAPI/TypeScript) focados em resiliência. Define códigos de erro estruturados, tipagens discriminadas e estratégias de fallback explícitas para cada endpoint. Ative ao projetar ou tipar APIs. | `modelar contrato de API`, `criar OpenAPI com erros`, `tipar endpoints com fallback`, `definir códigos de erro da API`, `API error codes` | [SKILL.md](file:///d:/specskills/conductor/skills/api-contract-modeling/SKILL.md) |
| **deadlock-avoidance** | 1.0.0 | Projeta e implementa mapeamento de recursos críticos e estratégias de evitaçao de deadlocks em código. Focado em resiliência, tratamento de exceções e recuperação graciosa em sistemas concorrentes e distribuídos. | `evitar deadlock`, `mapear recursos críticos`, `lock ordering`, `deadlock no código`, `concorrência resiliente`, `recursos compartilhados travando` | [SKILL.md](file:///d:/specskills/conductor/skills/deadlock-avoidance/SKILL.md) |
| **dev-env-hardening** | 1.0.0 | Isola e endurece o ambiente local de desenvolvimento do setup ao build do artefato. Foca em resiliência contra falhas de rede, vazamento de secrets e corrupção de cache. | `isolar ambiente local`, `hardening de dev`, `prevenir vazamento de variáveis`, `ambiente de dev seguro`, `setup resiliente`, `/hardening-dev` | [SKILL.md](file:///d:/specskills/conductor/skills/dev-env-hardeningversion/SKILL.md) |
| **domain-exception-hierarchy** | 1.0.0 | Projeta e gera hierarquias de exceções customizadas com contrato explícito, resiliência por camada e cobertura de casos excepcionais em cada etapa. Ative ao criar, refatorar ou auditar sistemas de erro de um domínio. | `criar exceções customizadas`, `hierarquia de exceções`, `contrato de exceções`, `tratamento de erros por domínio`, `resiliência em exceções`, `domain exceptions`, `/exception-hierarchy` | [SKILL.md](file:///d:/specskills/conductor/skills/domain-exception-hierarchy/SKILL.md) |
| **edge-case-mapper** | 1.0.0 | Mapeia sistematicamente casos de exceção e edge cases de negócio desde a recepção da tarefa até o build final. Garante que cada etapa do pipeline de geração tenha resiliência documentada e testável. | `mapear edge cases`, `casos de exceção`, `edge cases de negócio`, `exceções do domínio`, `resiliência de negócio`, `happy path não basta`, `caminhos alternativos`, `/edge-map` | [SKILL.md](file:///d:/specskills/conductor/skills/edge-case-mapper/SKILL.md) |
| **fta-code-level** | 1.0.0 | Mapeia Árvores de Falhas (FTA) diretamente no nível de método/função, conectando portas lógicas a exceções, estados nulos e gaps de resiliência. Gera artefato final estruturado em Markdown e diagrama Mermaid. | `análise de árvore de falhas`, `FTA do método`, `mapear falhas da função`, `fault tree code`, `analisar resiliência do método`, `/fta-code` | [SKILL.md](file:///d:/specskills/conductor/skills/fta-code-level/SKILL.md) |
| **idempotency-concurrency-safety** | 1.0.0 | Design de idempotência e segurança de concorrência — do recebimento da tarefa ao build final. Cobertura completa de race conditions, retry storms, double-write, deadlock e recovery em cada etapa do pipeline. | `idempotência`, `concorrência`, `race condition`, `double write`, `retry storm`, `deadlock`, `lock otimista`, `lock pessimista`, `idempotency key`, `operações atômicas`, `saga pattern`, `outbox pattern`, `/idempotencia`, `segurança de concorrência` | [SKILL.md](file:///d:/specskills/conductor/skills/idempotency-concurrency-safety/SKILL.md) |
| **injection-security-review** | 1.0.0 | Revisão de segurança em nível de código-fonte focada exclusivamente em vetores de injeção e técnicas de bypass de sanitização. Ative ao receber código para auditoria de segurança ou ao investigar vulnerabilidades de injeção em qualquer linguagem/framework. | `revisar segurança`, `auditoria de segurança`, `revisão de injeção`, `bypass de sanitização`, `analisar vulnerabilidade`, `code review de segurança`, `encontrar injection`, `SQL injection`, `XSS`, `command injection`, `/security-review`, `/audit-injection` | [SKILL.md](file:///d:/specskills/conductor/skills/injection-security-review/SKILL.md) |
| **req-fault-tolerance** | 1.0.0 | Analisa requisitos de software e injeta resiliência em código — do recebimento da tarefa (input) até a geração do artefato (build). Focado em mapear criticidade, exceções e fallbacks em cada etapa da execução. | `analisar criticidade`, `tolerância a falhas`, `casos de exceção do requisito`, `resiliência no build`, `edge cases de geração`, `o que fazer se falhar` | [SKILL.md](file:///d:/specskills/conductor/skills/req-fault-tolerance/SKILL.md) |
| **resilience-patterns** | 1.0.0 | Implementa padrões de resiliência a nível de código (Retry, Circuit Breaker, Timeout). Guia da captação da tarefa até o build do artefato, garantindo tolerância a falhas em integrações externas e processos de compilação/geração. | `implementar retry`, `circuit breaker`, `timeout de requisição`, `resiliência de código`, `padrão resilience4j`, `fallback de integração` | [SKILL.md](file:///d:/specskills/conductor/skills/resilience-patterns/SKILL.md) |
| **resilient-build** | 1.0.0 | Pipeline de geração de artefatos com resiliência em cada etapa. Checkpoint por etapa, validação multicamada, e relatório obrigatório. | `build pipeline`, `gerar artefato`, `resilient build`, `/resilient-build` | [SKILL.md](file:///d:/specskills/conductor/skills/resilient-build/SKILL.md) |
| **seed-mock-failure-simulation** | 1.0.0 | Engenharia de estado base (seeders/mocks) projetada para simulação de falhas. Cobre desde a análise do pedido até o artefato final executável, com resiliência em cada etapa. Ative ao criar, refatorar ou auditar seeders, factories ou mocks cujo propósito inclua testar cenários de exceção, chaos ou edge cases. | `criar seeder`, `criar mock`, `seed de falha`, `simulação de falha`, `estado base para teste`, `factory de teste`, `dados de teste edge case`, `/seed-failure` | [SKILL.md](file:///d:/specskills/conductor/skills/seed-mock-failure-simulation/SKILL.md) |
| **structured-log-contracts** | 1.0.0 | Define e implementa contratos de log estruturado (JSON) garantindo rastreabilidade ponta-a-ponta, resiliência contra falhas de serialização e isolamento total de side-effects. Foco em código de infraestrutura de observabilidade. | `criar log estruturado`, `contrato de log`, `rastreabilidade de falhas`, `structured logging`, `correlation id no log`, `log que não quebra a aplicação` | [SKILL.md](file:///d:/specskills/conductor/skills/structured-log-contracts/SKILL.md) |
| **ui-ux-code-generation** | 1.0.0 | Gera código frontend (HTML/CSS/JS/React) focado em resiliência visual. Elimina Layout Shifts (CLS), trata dados ausentes e garante fallbacks visuais e semânticos do consumo da tarefa até a entrega do artefato. | `criar tela`, `criar componente UI`, `layout responsivo`, `corrigir layout quebrado`, `UI com fallback`, `/criar-ui` | [SKILL.md](file:///d:/specskills/conductor/skills/ui-ux-code-generation/SKILL.md) |

---
**Last Updated**: 2026-04-21 00:46 (Local Time)

### api-contract-modeling
- **Description**: **Propósito**: Gerar especificações e tipagens de API onde o caso de erro é tão bem definido, tipado e documentado quanto o caso de sucesso, eliminando ambiguidade em tempo de build.
- **Signals**: `modelar contrato de API`, `criar OpenAPI com erros`, `tipar endpoints com fallback`, `definir códigos de erro da API`, `API error codes`, `modelar contrato de api`, `criar openapi com erros`, `definir códigos de erro da api`, `api error codes`
- **Always Recommend**: false

### deadlock-avoidance
- **Description**: **Propósito**: Projetar aquisição e liberação de recursos com ordenação estrita, timeouts e circuit breakers, eliminando deadlocks e garantindo fallback estruturado em cenários de falha.
- **Signals**: `evitar deadlock`, `mapear recursos críticos`, `lock ordering`, `deadlock no código`, `concorrência resiliente`, `recursos compartilhados travando`
- **Always Recommend**: false

### dev-env-hardeningversion
- **Description**: **Propósito**: Garantir que o processo de build local seja um sandbox impenetrável, reproduzível e resiliente, eliminando vazamentos de credenciais e "funciona na minha máquina" através de isolamento rigoroso e tratamento de falhas cirúrgico.
- **Signals**: `isolar ambiente local`, `hardening de dev`, `prevenir vazamento de variáveis`, `ambiente de dev seguro`, `setup resiliente`, `/hardening-dev`
- **Always Recommend**: false

### domain-exception-hierarchy
- **Description**: **Propósito**: Gerar um sistema de exceções que funcione como mapa de falhas do domínio —
- **Signals**: `criar exceções customizadas`, `hierarquia de exceções`, `contrato de exceções`, `tratamento de erros por domínio`, `resiliência em exceções`, `domain exceptions`, `/exception-hierarchy`
- **Always Recommend**: false

### edge-case-mapper
- **Description**: **Propósito**: Garantir que nenhuma tarefa chegue ao build sem ter seus
- **Signals**: `mapear edge cases`, `casos de exceção`, `edge cases de negócio`, `exceções do domínio`, `resiliência de negócio`, `happy path não basta`, `caminhos alternativos`, `/edge-map`
- **Always Recommend**: false

### fta-code-level
- **Description**: **Propósito**: Decompor funções/métodos em árvores de falhas determinísticas, mapeando cada caminho de erro para exceções concretas e gerando o artefato (Mermaid + Tabela) pronto para consumo ou geração de testes.
- **Signals**: `análise de árvore de falhas`, `FTA do método`, `mapear falhas da função`, `fault tree code`, `analisar resiliência do método`, `/fta-code`, `fta do método`
- **Always Recommend**: false

### idempotency-concurrency-safety
- **Description**: **Propósito**: Garantir que toda operação no pipeline — desde o parse do
- **Signals**: `idempotência`, `concorrência`, `race condition`, `double write`, `retry storm`, `deadlock`, `lock otimista`, `lock pessimista`, `idempotency key`, `operações atômicas`, `saga pattern`, `outbox pattern`, `/idempotencia`, `segurança de concorrência`
- **Always Recommend**: false

### injection-security-review
- **Description**: **Propósito**: Receber código-fonte, executar revisão sistemática por vetores de injeção,
- **Signals**: `revisar segurança`, `auditoria de segurança`, `revisão de injeção`, `bypass de sanitização`, `analisar vulnerabilidade`, `code review de segurança`, `encontrar injection`, `SQL injection`, `XSS`, `command injection`, `/security-review`, `/audit-injection`, `sql injection`, `xss`
- **Always Recommend**: false

### req-fault-tolerance
- **Description**: **Propósito**: Transformar requisitos brutos em código defensivo, garantindo que
- **Signals**: `analisar criticidade`, `tolerância a falhas`, `casos de exceção do requisito`, `resiliência no build`, `edge cases de geração`, `o que fazer se falhar`
- **Always Recommend**: false

### resilience-patterns
- **Description**: **Propósito**: Garantir que dependências externas e processos de build não derrubem o sistema principal através de isolamento de falhas, recuperação transparente e degradação graciosa.
- **Signals**: `implementar retry`, `circuit breaker`, `timeout de requisição`, `resiliência de código`, `padrão resilience4j`, `fallback de integração`
- **Always Recommend**: false

### resilient-build
- **Description**: **Propósito**: Executar builds como transações — ou entrega completa e validada, ou relatório claro de onde e por que parou.
- **Signals**: `build pipeline`, `gerar artefato`, `resilient build`, `/resilient-build`
- **Always Recommend**: false

### seed-mock-failure-simulation
- **Description**: **Propósito**: Gerar artefatos de estado base (seeders, factories, mocks) que sejam
- **Signals**: `criar seeder`, `criar mock`, `seed de falha`, `simulação de falha`, `estado base para teste`, `factory de teste`, `dados de teste edge case`, `/seed-failure`
- **Always Recommend**: false

### structured-log-contracts
- **Description**: **Propósito**: Garantir que toda exceção ou estado anômalo seja emitido como JSON imutável com identificadores de correlação, sem que a falha no processo de logging quebre ou degrade o fluxo principal da aplicação.
- **Signals**: `criar log estruturado`, `contrato de log`, `rastreabilidade de falhas`, `structured logging`, `correlation id no log`, `log que não quebra a aplicação`
- **Always Recommend**: false

### ui-ux-code-generation
- **Description**: **Propósito**: Transformar requisitos de interface em código de produção que não quebra — previnindo colapso de layout, vazamento de nulos e ausência de feedback visual.
- **Signals**: `criar tela`, `criar componente UI`, `layout responsivo`, `corrigir layout quebrado`, `UI com fallback`, `/criar-ui`, `criar componente ui`, `ui com fallback`
- **Always Recommend**: false
