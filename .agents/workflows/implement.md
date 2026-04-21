# /implement

Execute the implementation cycle for a track. This command orchestrates task progression, context loading, and expert protocol application.

## Usage

```bash
/implement [track-description]
```

## Objective

> [!NOTE]
> 1.  **Task Orchestration**: Automatically identifies and focuses on the next incomplete task in the implementation plan.
> 2.  **Context Injection**: Injects project metadata (**product**, **tech-stack**, **spec**) into the active conversation for high-fidelity execution.
> 3.  **Expert Guidance**: Triggers and applies the **specialized protocols** defined in the track's mindsets.

## Protocol (TDD Cycle)

> [!IMPORTANT]
> **OBRIGATÓRIO:** Você DEVE executar o comando `/implement` antes de iniciar qualquer tarefa. 
> 
> **NÃO** tente interpretar o `plan.md` ou o `spec.md` sozinho para começar a codar. Você precisa do output do comando `/implement` para receber os protocolos ativos de resiliência.
>
> 1.  Execute `/implement` e **PARE** para ler o output.
> 2.  **Red Phase**: Defina testes que falham para a tarefa atual indicada pelo comando.
> 3.  **Green Phase**: Implemente o código mínimo.
> 4.  **Refactor**: Limpe o código mantendo os testes.
> 5.  **Checkpoint**: Marque a tarefa como `[x]` no `plan.md`.

## Verification

- Ensure code coverage targets are met.
- Verify that specialized protocols (e.g., fault tolerance) were followed as per the plan's injections.

## Next Step

- After completing all tasks in a phase, use `/review` to validate against project standards.
