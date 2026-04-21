---
name: resilience-patterns
version: 1.0.0
description: >
  Implementa padrões de resiliência a nível de código (Retry, Circuit Breaker, Timeout).
  Guia da captação da tarefa até o build do artefato, garantindo tolerância a falhas
  em integrações externas e processos de compilação/geração.
triggers:
  - "implementar retry"
  - "circuit breaker"
  - "timeout de requisição"
  - "resiliência de código"
  - "padrão resilience4j"
  - "fallback de integração"
---

# RESILIENCE PATTERNS — Código inquebrável com Retry, Circuit Breaker e Timeout

> **Propósito**: Garantir que dependências externas e processos de build não derrubem o sistema principal através de isolamento de falhas, recuperação transparente e degradação graciosa.

## Filosofia Central

1. **Fail Fast via Timeout** — Nunca espere indefinidamente. Na prática: defina timeouts em todas as camadas (socket, connect, read) baseados no P99 do SLA, não no P50.
2. **Isolamento via Circuit Breaker** — Impedir falhas em cascata. Na prática: isole o serviço quebrado imediatamente após o limite de falhas, sem esperar o timeout.
3. **Recuperação via Retry** — Falhas transitórias são invisíveis ao usuário. Na prática: use backoff exponencial com jitter para evitar o efeito "thundering herd" (rebanho).
4. **Degradação via Fallback** — Nunca retorne erro cru ou `null` para o chamador. Na prática: todo circuito aberto ou esgotamento de retentativas deve executar uma lógica de contingência pré-definida.
5. **Telemetria Obrigatória** — O que não é monitorado não pode ser consertado. Na prática: emita métricas (success/failure/latency) para cada camada de resiliência.

## Quando Ativar

### ✅ Ativar para:
- Chamadas HTTP/gRPC para APIs de terceiros (pagamento, e-mail, S3).
- Processos de build/compilação que dependem de download de artefatos externos (npm, maven, docker pull).
- Consultas a bancos de dados distribuídos ou microserviços de leitura.

### ❌ NÃO ativar para:
- Validação de input do usuário (erro 400) → use `validation-patterns`.
- Falhas de lógica de negócio irreversíveis (ex: saldo insuficiente) → trate no domínio.
- Polling de banco de dados local → responda diretamente sem resiliência de rede.

## Escopo e Limites

**Stack Alvo**: TypeScript/Node.js (sintaxe principal), padrões aplicáveis a Java/Spring ou Go.
**Convenções de Nomenclatura**:

| Conceito | Nomenclatura | Exemplo |
|---|---|---|
| Config Timeout | `TIMEOUT_<VERBO>_<RECURSO>_MS` | `TIMEOUT_POST_PAYMENT_MS = 3000` |
| Config Retry | `RETRY_<AÇÃO>_MAX` | `RETRY_DOWNLOAD_DEP_MAX = 3` |
| Fallback Fn | `fallback<Recurso>` | `fallbackPdfGeneration` |

**Ferramentas de Enforcement**: Linter para proibir `fetch()` ou bibliotecas HTTP sem wrapper de timeout; SonarQube para blocos `catch` vazios.

## Protocolo de Execução

1. **Mapear** o ponto de falha — identificar se é I/O de rede, leitura de disco no build ou fila.
2. **Aplicar Timeout** — envolver a operação bruta com `Promise.race` ou config nativa da lib (Axios, Fetch, etc.).
3. **Envolver com Retry** — aplicar retry apenas se o erro for transitório (timeout, 503, 429). Proibir retry em 4xx (exceto 429).
4. **Proteger com Circuit Breaker** — adicionar o breaker *ao redor* da função já com retry e timeout.
5. **Definir Fallback** — codificar o caminho alternativo caso o circuito abra ou os retentativas acabem.
6. **Instrumentar** — adicionar logs estruturados contendo `{ action, attempt, latencyMs, error, circuitState }`.

## Padrões Específicos

### Padrão 1: Timeout Dual (Connect + Read)

**Regra**: Nunca use um timeout genérico. Separe o tempo de conexão do tempo de leitura de dados, especialmente em builds que baixam payloads grandes.

```typescript
// ✅ PASS — Timeout dual granular
async function downloadBuildArtifact(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000) // Timeout total máximo (fallback)
  });
  
  // Timeout específico de leitura do stream
  const streamTimeout = setTimeout(() => {
    response.body?.cancel(new Error('READ_TIMEOUT'));
  }, 15000);

  const buffer = await response.arrayBuffer();
  clearTimeout(streamTimeout);
  return buffer;
}

// ❌ FAIL — Timeout único causa falsos positivos em downloads lentos, 
// ou espera demais em conexões travadas
async function downloadBuildArtifact(url: string) {
  return await fetch(url); // Sem timeout, pode travar o build infinitamente
}
```

**Por que importa**: Sem o timeout dual, um servidor que aceita conexão (TCP) mas não envia dados trava o worker de build até o limite do SO (OOM ou kill).

---

### Padrão 2: Retry com Backoff Exponencial e Jitter

**Regra**: Retentativas devem ter intervalos crescentes e aleatoriedade (jitter) para evitar que múltiplas instâncias ataquem o serviço degradado simultaneamente.

```typescript
// ✅ PASS — Backoff + Jitter Completo
async function retryWithJitter<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isTransient = isTransientError(error);
      
      if (isLastAttempt || !isTransient) throw error;

      const baseDelay = Math.min(100 * Math.pow(2, attempt), 5000); // Cap em 5s
      const jitter = Math.random() * baseDelay; 
      
      await sleep(baseDelay + jitter);
    }
  }
  throw new Error('Unreachable');
}

function isTransientError(err: any): boolean {
  return [502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'].includes(err?.status || err?.code);
}

// ❌ FAIL — Retry fixo sem jitter (Thundering Herd)
for (let i = 0; i < 3; i++) {
  try { return await api.call(); } 
  catch { await sleep(1000); } // 3 requisições exatamente 1s depois
}
```

**Por que importa**: Retry fixo causa "Storm de Retentativas", derrubando o serviço de destino definitivamente.

---

### Padrão 3: Circuit Breaker (Estados)

**Regra**: O Circuit Breaker deve gerenciar os estados (Closed, Open, Half-Open) e o `Half-Open` deve permitir APENAS UMA requisição de teste, não liberar geral.

```typescript
// ✅ PASS — Half-Open restritivo
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastTestAttempt = 0;

  async exec<T>(fn: () => Promise<T>, fallbackFn: () => T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastTestAttempt > 30000) {
        this.state = 'HALF_OPEN'; // Tenta 1 vez após 30s
      } else {
        return fallbackFn(); // Degradação imediata
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return fallbackFn();
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastTestAttempt = Date.now();
    if (this.failures >= 5) this.state = 'OPEN';
  }
}

// ❌ FAIL — Half-Open sem controle de tráfego
if (this.failures >= 5) {
  this.state = 'OPEN';
  setTimeout(() => this.state = 'CLOSED', 30000); // Libera TUDO de uma vez
}
```

**Por que importa**: Liberar todo o tráfego de volta no `Half-Open` pode causar um pico de falhas que reabre o circuito instantaneamente, zerando a recuperação.

---

### Padrão 4: Fallback Tipado e Seguro

**Regra**: A função de fallback nunca deve quebrar. Ela deve retornar dados mock, cache antigo, ou enfileirar a operação, mas nunca lançar exceção.

```typescript
// ✅ PASS — Fallback com tipagem forte e graceful degradation
type PaymentResult = { status: 'PAID'; txId: string } | { status: 'PENDING'; txId: string };

async function processPayment(orderId: string): Promise<PaymentResult> {
  return breaker.exec(
    () => gateway.charge(orderId),
    () => ({ 
      status: 'PENDING', 
      txId: `PENDING_${Date.now()}` // Fallback: aceita pedido, reconcilia depois
    })
  );
}

// ❌ FAIL — Fallback que lança erro ou retorna tipo inconsistente
async function processPayment(orderId: string): Promise<PaymentResult> {
  return breaker.exec(
    () => gateway.charge(orderId),
    () => { throw new Error("Gateway falhou"); } // Quebra a regra de resiliência
  );
}
```

**Por que importa**: Um fallback que lança erro elimina todo o benefício do Circuit Breaker, propagando a falha para o chamador.

## Anti-Padrões Críticos

| Anti-padrão | Consequência | Alternativa Correta |
|---|---|---|
| Fazer Retry em erro 400 (Bad Request) | Sobrecarga inútil, gera logs de spam | Validar payload antes, não fazer retry em 4xx (exceto 429) |
| Timeout do cliente > Timeout do Load Balancer | O LB corta a conexão, o cliente acha que deu timeout de rede e faz retry, duplicando a request | Alinhar timeouts: `Timeout_Client < Timeout_LB < Timeout_Server` |
| Circuit Breaker por instância local (sem estado distribuído) em clusters grandes | Se 100 pods recebem 1 erro, o circuito abre apenas em 1 pod. Os outros 99 continuam atacando | Compartilhar estado do CB via Redis/Memcached em arquiteturas de muitos pods |
| Ausência de timeout no Fallback | O fallback faz I/O (ex: ler cache) e trava também | Fallback deve operar apenas com dados em memória (in-memory cache) |

## Critérios de Qualidade

Antes de finalizar a implementação, confirme:

- [ ] Toda chamada de rede ou I/O possui timeout configurado (preferencialmente connect + read).
- [ ] Retry implementa backoff exponencial, jitter e limite superior (cap).
- [ ] Retry possui validação de erro transitório (isTransientError) implementada.
- [ ] Circuit Breaker implementa o estado Half-Open limitando a 1 requisição de teste.
- [ ] Fallback está implementado, é tipado igual à função principal e não lança exceções.
- [ ] Cadeia de resiliência está na ordem correta: `Timeout` -> `Retry` -> `Circuit Breaker` -> `Fallback`.
- [ ] Logs emitidos contêm contexto de retentativa (tentativa X de Y) e estado do circuito.
- [ ] Não há retry sobre retry (cascata de retentativas).

## Referências Cruzadas

| Precisa de... | Use a skill... |
|---|---|
| Estruturar o client HTTP base antes de aplicar resiliência | `api-client` |
| Tratar erros assíncronos e Dead Letter Queues | `async-flows` |
| Padrões de mock/stub para testar o Fallback | `testing-patterns` |
| O que fazer quando o Fallback falha também | `incident-escalation` |