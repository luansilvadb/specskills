---
name: edge-case-mapper
version: 1.0.0
description: >
  Mapeia sistematicamente casos de exceção e edge cases de negócio
  desde a recepção da tarefa até o build final. Garante que cada etapa
  do pipeline de geração tenha resiliência documentada e testável.
triggers:
  - "mapear edge cases"
  - "casos de exceção"
  - "edge cases de negócio"
  - "exceções do domínio"
  - "resiliência de negócio"
  - "happy path não basta"
  - "caminhos alternativos"
  - "/edge-map"
---

# EDGE CASE MAPPER — Exceções mapeadas, build blindado

> **Propósito**: Garantir que nenhuma tarefa chegue ao build sem ter seus
> casos de exceção e edge cases de negócio identificados, categorizados,
> priorizados e traduzidos em resiliência em cada etapa do pipeline.

---

## Filosofia Central

1. **Happy path é minoria** — O caminho ideal cobre 60-80% dos casos reais.
   Na prática: toda feature sem mapeamento de exceção é uma feature incompleta.

2. **Exceção de negócio ≠ exceção técnica** — `null` é técnico; "cliente com
   crédito negativo tentando parcelar" é de negócio.
   Na prática: sempre pergunte "qual regra de domínio esta entrada viola?".

3. **Categorizar antes de resolver** — Edge cases de dados, estado, tempo e
   integração exigem estratégias diferentes.
   Na prática: nunca trate todos os excepcionais com um `if` genérico.

4. **Resiliência por camada** — Cada etapa do pipeline (parse → validate →
   transform → build) tem seus próprios pontos de falha.
   Na prática: documente qual etapa falha e qual o recovery para cada caso.

5. **Prioridade por impacto, não por frequência** — Um edge case raro mas
   catastrófico (ex: pagamento duplicado) vale mais que um frequente mas
   inofensivo (ex: timeout de cache).
   Na prática: classifique por severidade × probabilidade, não só por counts.

6. **Documentar é prevenir** — Um edge case documentado no momento da
   recepção da tarefa evita 3x o retrabalho no QA.
   Na prática: o mapeamento acontece ANTES do código, não depois.

---

## Quando Ativar

### ✅ Ativar para:
- Recepção de qualquer tarefa que envolva regras de negócio
- Revisão de código onde o happy path é o único caminho coberto
- Solicitação explícita de "o que pode dar errado aqui?"
- Design de API, contrato ou schema que precise ser resiliente
- Antes de escrever testes — para garantir que os testes certos existam
- Refatoração onde edge cases foram ignorados na versão anterior

### ❌ NÃO ativar para:
- Tratamento de erros puramente técnicos (null pointer, stack overflow) → use `error-handling-patterns`
- Definição de estratégia de testes automatizados → use `test-strategy`
- Logging e observabilidade → responda diretamente com padrões de logging
- Edge cases de infraestrutura (OOM, disk full) → responda diretamente

---

## Escopo e Limites

### Coberto por esta skill:
| Dimensão | Exemplos |
|---|---|
| **Dados** | Valores vazios, limites numéricos, strings malformadas, enums inválidos, tipos misturados |
| **Estado** | Transições ilegais, estados órfãos, race conditions de domínio, stale data |
| **Tempo** | Timezone, horário de verão, expiração entre steps, clocks desfalcados, anos bissextos |
| **Regra de negócio** | Limites de crédito, restrições por perfil, combinações proibidas, sazonalidade |
| **Integração** | Serviço downstream lento, resposta malformada, dados inconsistentes entre sistemas |
| **Volume** | Lista vazia, lista gigante, paginação ausente, batch que não cabe em memória |
| **Concorrência** | Duplo submit, conflito de versão, lock expirado, duas instâncias processando mesmo item |

### Delegado para outras skills:
| Caso | Delegate para |
|---|---|
| Implementar try/catch, circuit breaker, retry | `error-handling-patterns` |
| Converter edge cases em testes automatizados | `test-strategy` |
| Garantir resiliência em chamadas HTTP | `api-design` |
| Schema validation em entrada de API | `schema-validation` |

---

## Inputs Aceitos

| Formato | Descrição |
|---|---|
| Descrição de tarefa em linguagem natural | "Criar endpoint de cancelamento de assinatura" |
| Código existente | Função/módulo que precisa de mapeamento de exceções |
| Especificação/PRD | Documento com regras de negócio a serem decompostas |
| API contract (OpenAPI, GraphQL schema) | Contrato que precisa de análise de resiliência |
| Caso de uso em formato Use Case | Com pré/pós-condições e fluxo principal |

---

## Outputs Esperados

```
EDGE_CASE_MAP.md (ou inline na resposta)
│
├── 1. CONTEXTO DA TAREFA
│   ├── Resumo 1 frase
│   └── Tipo (geração | análise | transformação | integração)
│
├── 2. MATRIZ DE EDGE CASES
│   └── Tabela: ID | Categoria | Descrição | Severidade | Probabilidade | Etapa de falha
│
├── 3. DETALHAMENTO POR EDGE CASE
│   ├── Condição de trigger (quando ocorre)
│   ├── Comportamento esperado (o que o sistema deve fazer)
│   ├── Comportamento NÃO aceitável (o que NÃO deve fazer)
│   ├── Recovery strategy (como voltar ao estado seguro)
│   └── Exemplo concreto (input → output)
│
├── 4. RESILIÊNCIA POR ETAPA DO BUILD
│   └── Tabela: Etapa | Edge cases que afetam | Guard clause | Recovery
│
├── 5. EDGE CASES DESCARTADOS (com justificativa)
│
└── 6. CONVERSÃO PARA AÇÃO
    ├── Guards a implementar (lista de if/throw/return)
    ├── Validações de entrada (schema/joi/zod/etc)
    ├── Testes a escrever (describe/it por edge case)
    └── Logs/métricas a adicionar (o que monitorar)
```

---

## Critérios de Parada

O mapeamento está completo quando:

1. **Coverage check**: Todos os 7 tipos de dimensão (dados, estado, tempo, regra, integração, volume, concorrência) foram ao menos considerados — mesmo que o resultado seja "não aplicável com justificativa".

2. **Severidade check**: Todos os edge cases classificados como CRÍTICO ou ALTO têm recovery strategy definido.

3. **Pipeline check**: Cada etapa do build tem pelo menos um guard clause mapeado.

4. **Descarte check**: Há uma seção explícita de edge cases considerados e descartados com justificativa — silêncio não é aceitação.

5. **Exemplo check**: Todo edge case CRÍTICO tem um exemplo concreto de input→output.

---

## Fallbacks

| Situação | Fallback |
|---|---|
| Tarefa mal especificada — não dá para inferir regras | Gerar mapeamento apenas das dimensões universais (dados, volume, tempo) e sinalizar lacunas como `⚠️ REQUER CLARIFICAÇÃO` |
| Domínio desconhecido pelo modelo | Declarar limitação explícita e mapear apenas edge cases genéricos + sugerir que especialista do domínio revise |
| Código existente sem testes nem docs | Mapear por leitura estática do código (analisar branches, defaults, casts) e marcar cada item com confiança (ALTA/MÉDIA/BAIXA) |

---

## Protocolo de Execução

### Fase 1 — Recepção e Contextualização

1. **Ler** a tarefa ou código fornecido — identificar o tipo (geração de artefato, análise, transformação, integração).
2. **Extrair** as entidades de negócio envolvidas (ex: "assinatura", "pagamento", "usuário").
3. **Listar** as regras de negócio explícitas mencionadas ou inferíveis.
4. **Identificar** o pipeline de etapas do build (ex: `parse input → validate → transform → generate → write file`).
5. **Output**: Seção `1. CONTEXTO DA TAREFA` preenchida.

### Fase 2 — Varredura Sistemática por Dimensão

6. **Dados**: Para cada campo de entrada, perguntar:
   - E se vazio/nulo?
   - E se no limite mínimo/máximo?
   - E se tipo errado (string onde espera número)?
   - E se encoding incorreto?
   - E se contém caracteres especiais/injeção?

7. **Estado**: Para cada entidade com ciclo de vida, perguntar:
   - Quais transições são válidas? Quais são ilegais?
   - E se a entidade está em estado intermediário (ex: "processing")?
   - E se o estado foi modificado por outra operação entre a leitura e a escrita?

8. **Tempo**: Para cada operação que depende de tempo, perguntar:
   - Timezone do dado vs. timezone do servidor?
   - Horário de verão (DST) afeta o cálculo?
   - E se a operação expirar entre steps?
   - Dados com data no futuro ou no passado extremo (1970, 2099)?

9. **Regra de negócio**: Para cada regra explícita, perguntar:
   - Qual é o limite exato (>= ou >)? E no limite?
   - Há perfis/isenções que ignoram a regra?
   - Duas regras podem se contradizer em algum cenário?
   - E se a regra mudar durante a execução (ex: promoção expira)?

10. **Integração**: Para cada dependência externa, perguntar:
    - E se retornar sucesso mas dados inconsistentes?
    - E se retornar erro inesperado (500 vs 4xx vs timeout)?
    - E se retornar estrutura diferente do esperado?
    - E se responder corretamente mas com delay de 30s?

11. **Volume**: Para cada lista/coleção, perguntar:
    - E se vazia?
    - E se tiver 1 item?
    - E se tiver 10.000+ itens?
    - E se todos os itens forem idênticos?
    - E se a paginação estiver inconsistente?

12. **Concorrência**: Para cada operação com efeito colateral, perguntar:
    - E se dois requests chegarem simultaneamente?
    - E se o usuário clicar duas vezes?
    - E se um retry automático executar após o primeiro ter parcialmente succeeded?
    - E se o lock expirar antes da conclusão?

13. **Output**: Seção `2. MATRIZ DE EDGE CASES` preenchida.

### Fase 3 — Priorização e Detalhamento

14. **Classificar** cada edge case por severidade:
    - **CRÍTICO**: Perda de dados, corrupção, dupla execução, violação de segurança
    - **ALTO**: Resultado incorreto silencioso, degraded experience para muitos usuários
    - **MÉDIO**: Resultado incorreto com recovery possível, erro visível mas contido
    - **BAIXO**: Inconveniente menor, fallback aceitável

15. **Classificar** cada edge case por probabilidade:
    - **CERTO**: Acontece em produção regularmente
    - **PROVÁVEL**: Acontecerá em algum momento
    - **POSSÍVEL**: Pode acontecer em condições específicas
    - **IMPROVÁVEL**: Requer combinação rara de condições

16. **Detalhar** todos os edge cases classificados como CRÍTICO ou ALTO usando o template completo (trigger, comportamento esperado, NÃO aceitável, recovery, exemplo).
17. **Detalhar** edge cases MÉDIO com versão reduzida (trigger + comportamento + recovery).
18. **Listar** edge cases BAIXO em tabela apenas.
19. **Output**: Seção `3. DETALHAMENTO POR EDGE CASE` preenchida.

### Fase 4 — Resiliência por Etapa do Build

20. **Para cada etapa** do pipeline identificado em (4), mapear:
    - Quais edge cases desta etapa podem causar falha?
    - Qual é o guard clause (verificação que impede a falha)?
    - Qual é o recovery (o que fazer se falhar apesar do guard)?
21. **Output**: Seção `4. RESILIÊNCIA POR ETAPA DO BUILD` preenchida.

### Fase 5 — Descarte e Conversão para Ação

22. **Listar** edge cases considerados durante a varredura mas deliberadamente excluídos — cada um com justificativa.
23. **Converter** edge cases CRÍTICO/ALTO em:
    - Guards a implementar (pseudocódigo ou código real)
    - Validações de entrada (schema se aplicável)
    - Testes a escrever (nome do teste + assert esperado)
    - Logs/métricas (o que monitorar para saber se o edge case aconteceu)
24. **Output**: Seções `5. EDGE CASES DESCARTADOS` e `6. CONVERSÃO PARA AÇÃO` preenchidas.

### Fase 6 — Validação Final

25. **Executar** o checklist de critérios de qualidade (§ Critérios de Qualidade).
26. **Entregar** o mapeamento completo com 1 parágrafo de resumo executivo no topo.

---

## Padrões Específicos

### Padrão 1 — Nomenclatura de Edge Case IDs

**Regra**: Todo edge case recebe um ID no formato `EC-{dimensão}-{número}` onde dimensão é uma sigla de 3 letras.

```
DAT = dados | EST = estado | TMP = tempo | NEG = negócio
INT = integração | VOL = volume | CON = concorrência
```

```text
✅ PASS
EC-DAT-001: Campo nome com string vazia
EC-NEG-003: Cliente com crédito negativo tentando parcelar em 12x
EC-CON-002: Duplo submit no endpoint de pagamento

❌ FAIL
Edge case 1: nome vazio
Problema: crédito negativo
Bug: duplo clique
```

**Por que importa**: IDs rastreáveis permitem referência cruzada entre mapeamento, código, testes e logs. Sem ID, o edge case se perde na conversão para código.

---

### Padrão 2 — Descrição de Edge Case em Formato Condicional

**Regra**: Todo edge case deve ser descrito como `QUANDO [condição] ENTAO [comportamento esperado]`.

```markdown
✅ PASS
EC-NEG-001: QUANDO cliente possui crédito negativo E tenta parcelar em >= 6x
ENTÃO retornar 422 com erro { code: "CREDIT_INSUFFICIENT", message: "...", min_installments: 3 }

❌ FAIL
EC-NEG-001: Clientes com crédito ruim não podem parcelar muito
```

**Por que importa**: Formato condicional elimina ambiguidade. "Não podem parcelar muito" não diz qual é o limite, nem qual é o erro retornado.

---

### Padrão 3 — Recovery Strategy Sempre Explicitado

**Regra**: Todo edge case CRÍTICO ou ALTO deve ter uma das 4 estratégias de recovery explicitamente nomeada.

| Estratégia | Quando usar | Exemplo |
|---|---|---|
| **REJECT** | Dado inválido, não há como corrigir automaticamente | Retornar 400 com detalhes do erro |
| **FALLBACK** | Caminho alternativo viável | Usar cache quando serviço está down |
| **COMPENSATE** | Ação parcial foi executada, precisa desfazer | Estornar pagamento se envio de email falhou |
| **DEFER** | Não é possível resolver agora, mas não é urgente | Enfileirar para processamento assíncrono |

```markdown
✅ PASS
**Recovery**: COMPENSATE — se o débito foi realizado mas a notificação falhou,
estornar o débito e marcar como "pending_retry" na fila de notificações.

❌ FAIL
**Recovery**: Tratar o erro adequadamente.
```

**Por que importa**: "Tratar adequadamente" não é uma estratégia. Sem a categoria nomeada, o desenvolvedor inventa uma solução diferente cada vez.

---

### Padrão 4 — Exemplo Concreto com Input→Output Real

**Regra**: Edge cases CRÍTICOS devem ter exemplo com dados reais, não descrições abstratas.

```json
✅ PASS — EC-DAT-003: Valor monetário com precisão decimal incorreta
INPUT:  { "amount": 0.1 + 0.2, "currency": "BRL" }
STATE:  amount = 0.30000000000000004 (floating point)
OUTPUT: { "error": { "code": "INVALID_AMOUNT", "message": "Valor possui mais de 2 casas decimais: 0.30000000000000004", "max_decimals": 2 } }

❌ FAIL
EC-DAT-003: Número float pode ter problema de precisão.
Exemplo: passar 0.3 pode dar errado.
```

**Por que importa**: O exemplo concreto mostra o valor exato que causa o problema, eliminando a necessidade de "adivinhar" o edge case durante implementação.

---

### Padrão 5 — Guard Clause por Etapa do Build

**Regra**: Cada etapa do pipeline deve ter seus guards documentados como pseudocódigo com `return` ou `throw` explícito.

```typescript
✅ PASS
// Etapa: VALIDATE
function validateInput(raw: unknown): ValidatedInput {
  if (!raw || typeof raw !== 'object') throw new ValidationError('EC-DAT-001: Input não é objeto');
  if (!('items' in raw) || !Array.isArray(raw.items)) throw new ValidationError('EC-DAT-002: Campo "items" ausente ou não é array');
  if (raw.items.length === 0) throw new ValidationError('EC-VOL-001: Lista de itens vazia — use null para "sem itens"');
  if (raw.items.length > 500) throw new ValidationError('EC-VOL-002: Máximo 500 itens por requisição');
  return raw as ValidatedInput;
}

❌ FAIL
// Etapa: VALIDATE
function validateInput(raw: unknown) {
  // valida os dados
  if (something) return error;
}
```

**Por que importa**: Guards sem tipo de erro, sem ID do edge case e sem return/throw explícito geram logs inúteis quando falham.

---

### Padrão 6 — Matriz de Severidade × Probabilidade

**Regra**: Todo mapeamento deve incluir a matriz visual com edge cases posicionados.

```
✅ PASS
         | IMPROVÁVEL    | POSSÍVEL       | PROVÁVEL        | CERTO
---------|----------------|-----------------|-----------------|------
CRÍTICO  |                | EC-CON-001      | EC-NEG-003      |
ALTO     |                | EC-INT-002      | EC-DAT-001      | EC-VOL-001
MÉDIO    | EC-TMP-003     | EC-EST-001      |                 | EC-DAT-004
BAIXO    | EC-TMP-001     |                 |                 |

❌ FAIL
Priorizei os edge cases por ordem de importância.
```

**Por que importa**: A matriz força uma priorização visual e impede que edge cases PROVÁVEL+CRÍTICO fiquem na mesma prioridade que IMPROVÁVEL+BAIXO.

---

## Anti-Padrões Críticos

| Anti-padrão | Consequência | Alternativa correta |
|---|---|---|
| Listar edge cases sem categorizar | Mistura tipos diferentes, tratamento genérico | Usar as 7 dimensões obrigatórias |
| "Tratar erro genérico" sem especificar qual | try/catch que engole exceções reais | Cada edge case com seu próprio erro nomeado |
| Mapear só depois que o bug apareceu | Reativo, caro, gera débito técnico | Mapear na recepção da tarefa, antes do código |
| Edge case sem exemplo concreto | Implementador interpreta de forma diferente | Input→Output com dados reais |
| Ignorar a etapa do build onde falha | Guard no lugar errado, erro passa despercebido | Mapear "qual etapa falha" para cada edge case |
| Listar 50 edge cases sem priorizar | Paralisa por excesso de informação | Classificar por severidade × probabilidade |
| "O usuário não vai fazer isso" | Usuário sempre faz isso | Assumir que todo input possível vai acontecer |
| Recovery como "logar e ignorar" | Erro silencioso, dados corrompidos | REJECT/FALLBACK/COMPENSATE/DEFER explícito |
| Mapear edge cases técnicos como de negócio | Confusão de responsabilidade | Separar: "campo nulo" (DAT) vs "regra violada" (NEG) |
| Não documentar edge cases descartados | Revisor pergunta "por que não considerou X?" | Seção de descarte com justificativa por item |

---

## Critérios de Qualidade

Antes de entregar, confirme:

- [ ] Frontmatter completo com name, version, description, triggers e scope
- [ ] Seção de contexto com tipo de tarefa e entidades identificadas
- [ ] Pipeline de etapas do build explicitado antes do mapeamento
- [ ] Todas as 7 dimensões foram varridas (mesmo que resulte em "não aplicável")
- [ ] Cada edge case tem ID no formato `EC-{XXX}-{nnn}`
- [ ] Cada edge case descrito no formato QUANDO/ENTÃO
- [ ] Todos os CRÍTICOS e ALTOS detalhados com trigger + comportamento + recovery + exemplo
- [ ] Recovery strategy nomeada (REJECT/FALLBACK/COMPENSATE/DEFER) para CRÍTICOS/ALTOS
- [ ] Matriz severidade × probabilidade preenchida
- [ ] Resiliência por etapa do build com guard clauses em pseudocódigo
- [ ] Seção de edge cases descartados com justificativa
- [ ] Seção de conversão para ação (guards + validações + testes + logs)
- [ ] Zero afirmações genéricas do tipo "tratar erro adequadamente"
- [ ] Comprimento total: 300-800 linhas (denso, não extenso)

---

## Referências Cruzadas

| Precisa de... | Use a skill... |
|---|---|
| Implementar try/catch, retry, circuit breaker | `error-handling-patterns` |
| Converter edge cases mapeados em testes automatizados | `test-strategy` |
| Garantir resiliência em contratos de API | `api-design` |
| Validar schemas de entrada (Zod, Joi, Pydantic) | `schema-validation` |
| Criar documento com o mapeamento | `docx` ou `markdown` |
| Logar e monitorar edge cases em produção | `observability` |

---

## Exemplo Completo — Mapeamento End-to-End

> **Tarefa**: "Criar função que gera boleto bancário a partir de uma ordem de pagamento"

### 1. CONTEXTO DA TAREFA

- **Resumo**: Gerar linha digitável e código de barras de boleto a partir de dados de ordem de pagamento.
- **Tipo**: Geração de artefato
- **Entidades**: OrdemPagamento, Boleto, Pagador, Beneficiário
- **Pipeline de build**: `receber input → validar dados → calcular dígitos → gerar linha digitável → gerar código de barras → formatar saída`

### 2. MATRIZ DE EDGE CASES

| ID | Dimensão | Descrição | Severidade | Probabilidade | Etapa de falha |
|---|---|---|---|---|---|
| EC-DAT-001 | Dados | Campo valor é string não-numérica | CRÍTICO | CERTO | validar dados |
| EC-DAT-002 | Dados | Campo valor é zero | ALTO | PROVÁVEL | validar dados |
| EC-DAT-003 | Dados | Campo valor tem mais de 2 casas decimais | ALTO | PROVÁVEL | validar dados |
| EC-DAT-004 | Dados | CPF/CNPJ do pagador com dígitos verificadores inválidos | ALTO | PROVÁVEL | validar dados |
| EC-DAT-005 | Dados | Nome do pagador contém apenas espaços | MÉDIO | POSSÍVEL | validar dados |
| EC-DAT-006 | Dados | Data de vencimento no formato incorreto | ALTO | POSSÍVEL | validar dados |
| EC-DAT-007 | Dados | Data de vencimento é data passada (mais de 6 meses) | MÉDIO | POSSÍVEL | validar dados |
| EC-NEG-001 | Negócio | Valor excede o limite máximo do banco (R$ 999.999,99) | CRÍTICO | POSSÍVEL | calcular dígitos |
| EC-NEG-002 | Negócio | Ordem já teve boleto gerado anteriormente (idempotência) | CRÍTICO | PROVÁVEL | receber input |
| EC-NEG-003 | Negócio | Vencimento cai em feriado ou final de semana | MÉDIO | PROVÁVEL | calcular dígitos |
| EC-EST-001 | Estado | Ordem está em status "cancelled" | CRÍTICO | POSSÍVEL | receber input |
| EC-EST-002 | Estado | Ordem está em status "paid" (já foi paga) | CRÍTICO | PROVÁVEL | receber input |
| EC-TMP-001 | Tempo | Vencimento em 29/02 em ano não-bissexto | MÉDIO | IMPROVÁVEL | validar dados |
| EC-VOL-001 | Volume | Requisição com 1.000 ordens em batch | ALTO | POSSÍVEL | receber input |
| EC-VOL-002 | Volume | Batch com 0 ordens | BAIXO | POSSÍVEL | receber input |
| EC-INT-001 | Integração | Lookup de beneficiário retorna dados desatualizados | CRÍTICO | IMPROVÁVEL | validar dados |
| EC-CON-001 | Concorrência | Duas requisições simultâneas para mesma ordem | CRÍTICO | PROVÁVEL | receber input |

### 3. DETALHAMENTO (CRÍTICOS E ALTOS)

#### EC-DAT-001: Campo valor é string não-numérica

**Trigger**: `input.amount = "cem reais"` ou `input.amount = null`

**Comportamento esperado**: Retornar erro `400` com `{ code: "INVALID_AMOUNT", field: "amount", expected: "number with max 2 decimal places", received: "string" }`

**Comportamento NÃO aceitável**: Tentar parsear com `parseFloat()` silenciosamente (retornaria `NaN` e geraria boleto com valor "NaN")

**Recovery**: REJECT — rejeitar imediatamente sem processar nada mais

**Exemplo**:
```json
INPUT:  { "amount": "100,00", "currency": "BRL" }
OUTPUT: { "error": { "code": "INVALID_AMOUNT", "field": "amount", "message": "Valor deve ser numérico. Recebido: string \"100,00\". Use ponto decimal: 100.00" } }
```

#### EC-NEG-001: Valor excede limite do banco

**Trigger**: `input.amount = 1_000_000.00`

**Comportamento esperado**: Retornar erro `422` com `{ code: "AMOUNT_EXCEEDS_LIMIT", max: 999999.99, received: 1000000.00 }`

**Comportamento NÃO aceitável**: Gerar boleto com valor truncado ou com dígito verificador calculado sobre valor overflowado

**Recovery**: REJECT — este é um limite do formato do boleto (campo de valor tem 10 dígitos máx = 999.999,99)

**Exemplo**:
```json
INPUT:  { "amount": 1500000.00 }
OUTPUT: { "error": { "code": "AMOUNT_EXCEEDS_LIMIT", "message": "Valor máximo para boleto: R$ 999.999,99. Recebido: R$ 1.500.000,00.", "max": 999999.99, "received": 1500000.00 } }
```

#### EC-NEG-002: Ordem já teve boleto gerado (idempotência)

**Trigger**: Segunda chamada com `orderId = "ord_123"` que já possui boleto `bol_456`

**Comportamento esperado**: Retornar o boleto existente `bol_456` sem gerar novo. Response `200` (não `409`).

**Comportamento NÃO aceitável**: Gerar segundo boleto (dois boletos para mesma ordem = potencial pagamento duplo)

**Recovery**: FALLBACK — retornar existente como se fosse a primeira geração

**Exemplo**:
```json
INPUT (1ª chamada): { "orderId": "ord_123", "amount": 150.00, ... }
OUTPUT (1ª chamada): { "boletoId": "bol_456", "linhaDigitavel": "00190...", "nossoNumero": "00012345" }

INPUT (2ª chamada): { "orderId": "ord_123", "amount": 150.00, ... }
OUTPUT (2ª chamada): { "boletoId": "bol_456", "linhaDigitavel": "00190...", "nossoNumero": "00012345" }
                    // Mesmo boleto, mesma response — idempotente
```

#### EC-CON-001: Duas requisições simultâneas para mesma ordem

**Trigger**: Request A e Request B chegam com `orderId = "ord_789"` com < 5ms de diferença. Nenhum boleto existe ainda.

**Comportamento esperado**: Apenas um boleto é criado. A request que perder a corrida recebe o boleto criado pela outra (mesmo comportamento de EC-NEG-002).

**Comportamento NÃO aceitável**: Dois boletos criados (race condition)

**Recovery**: FALLBACK com lock otimista — usar `INSERT ... ON CONFLICT DO NOTHING` ou equivalente, then `SELECT` para retornar o existente

**Exemplo**:
```sql
-- Guard clause no nível de banco
INSERT INTO boletos (order_id, linha_digitavel, ...)
VALUES ('ord_789', '00190...', ...)
ON CONFLICT (order_id) DO NOTHING;
-- Se insertou 0 rows, é porque a outra request ganhou
SELECT * FROM boletos WHERE order_id = 'ord_789';
-- Retornar o que encontrou
```

### 4. RESILIÊNCIA POR ETAPA DO BUILD

| Etapa | Edge cases que afetam | Guard clause | Recovery |
|---|---|---|---|
| **receber input** | EC-NEG-002, EC-EST-001, EC-EST-002, EC-CON-001, EC-VOL-001, EC-VOL-002 | `if (batch.length > 500) throw BATCH_TOO_LARGE; if (order.status !== 'pending') throw INVALID_ORDER_STATUS; lock(orderId)` | EC-VOL: particionar batch em chunks de 500. EC-EST/EC-NEG-002: retornar existente ou erro. EC-CON: lock + idempotência |
| **validar dados** | EC-DAT-001 a EC-DAT-007, EC-TMP-001, EC-INT-001 | Schema validation (Zod/Joi) com todas as regras. Verificação de dígito CPF/CNPJ. Parse estrito de data | REJECT para cada erro com code + field + message |
| **calcular dígitos** | EC-NEG-001, EC-NEG-003 | `if (amount > 999999.99) throw AMOUNT_EXCEEDS_LIMIT; adjustDueDateForHoliday(dueDate)` | EC-NEG-001: REJECT. EC-NEG-003: ajustar para próximo dia útil |
| **gerar linha digitável** | Nenhum edge case nesta etapa isoladamente | — | — |
| **gerar código de barras** | Nenhum edge case nesta etapa isoladamente | — | — |
| **formatar saída** | Nenhum edge case nesta etapa isoladamente | — | — |

### 5. EDGE CASES DESCARTADOS

| Caso considerado | Motivo do descarte |
|---|---|
| Boleto com valor negativo (estorno) | Fora do escopo — estornos usam outro fluxo (crédito em conta), não boleto |
| Pagador menor de idade | Regra de negócio não aplicável a boleto — o banco não valida idade do pagador |
| Encoding UTF-8 no nome do pagador | O layout do boleto usa apenas ASCII — qualquer caractere especial é sanitizado na etapa de formatação, não é edge case de negócio |
| Falha de impressão do boleto | Fora do escopo desta função — responsabilidade do front/cliente que recebe a linha digitável |

### 6. CONVERSÃO PARA AÇÃO

**Guards a implementar**:
```typescript
// No início da função generateBoleto()
if (order.status !== 'pending') throw new BoletoError('EC-EST-001', `Ordem ${order.id} está em status "${order.status}", esperado "pending"`);
if (existingBoleto) return existingBoleto; // EC-NEG-002
if (batch && batch.length > 500) throw new BoletoError('EC-VOL-001', `Batch de ${batch.length} excede limite de 500`);
```

**Validações de schema (Zod)**:
```typescript
const BoletoInputSchema = z.object({
  amount: z.number().positive().max(999999.99).multipleOf(0.01), // EC-DAT-001, EC-DAT-002, EC-DAT-003, EC-NEG-001
  payerDocument: z.string().refine(validateCPFOrCNPJ), // EC-DAT-004
  payerName: z.string().trim().min(2), // EC-DAT-005
  dueDate: z.string().datetime().refine(isValidDate).refine(isNotPast6Months), // EC-DAT-006, EC-DAT-007
});
```

**Testes a escrever**:
```typescript
describe('EC-DAT-001', () => {
  it('deve rejeitar amount como string', () => {
    expect(() => generateBoleto({ amount: "100" })).toThrowWithCode('INVALID_AMOUNT');
  });
});

describe('EC-NEG-002', () => {
  it('deve retornar boleto existente se chamado duas vezes', async () => {
    const result1 = await generateBoleto({ orderId: 'ord_1', amount: 100 });
    const result2 = await generateBoleto({ orderId: 'ord_1', amount: 100 });
    expect(result1.boletoId).toBe(result2.boletoId);
  });
});

describe('EC-CON-001', () => {
  it('deve criar apenas um boleto com chamadas paralelas', async () => {
    const [r1, r2] = await Promise.all([
      generateBoleto({ orderId: 'ord_2', amount: 200 }),
      generateBoleto({ orderId: 'ord_2', amount: 200 }),
    ]);
    expect(r1.boletoId).toBe(r2.boletoId);
    // Verificar que só existe 1 boleto no banco
    const count = await db.boletos.count({ where: { orderId: 'ord_2' } });
    expect(count).toBe(1);
  });
});

describe('EC-NEG-001', () => {
  it('deve rejeitar valor acima de R$ 999.999,99', () => {
    expect(() => generateBoleto({ amount: 1_000_000 })).toThrowWithCode('AMOUNT_EXCEEDS_LIMIT');
  });
  it('deve aceitar valor exatamente R$ 999.999,99', () => {
    expect(() => generateBoleto({ amount: 999999.99 })).not.toThrow();
  });
});
```

**Logs/métricas a adicionar**:
```typescript
// Para cada edge case que ocorrer em produção
metrics.increment('boleto.edge_case', { case: 'EC-DAT-001', field: 'amount' });
logger.warn('Edge case triggered', { caseId: 'EC-NEG-002', orderId: order.id, existingBoletoId: existing.id });

// Alerta se edge case CRÍTICO acontecer mais de 10x/hora
alertIfExceeds('boleto.edge_case.CRITICAL', 10, '1h');
```

---

> **Resumo executivo**: Este mapeamento identificou 16 edge cases para a geração de boleto,
> sendo 5 CRÍTICOS (valor inválido, idempotência, status inválido, concurrency, integração desatualizada).
> Os 5 CRÍTICOS têm recovery definido e guards implementáveis. O edge case de maior risco
> operacional é EC-CON-001 (concorrência), mitigado com lock otimista no banco.
> Salvar em `/docs/edge-cases/boleto-edge-cases.md`.