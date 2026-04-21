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
> 1.  **Red Phase**: Define failing tests for the current task.
> 2.  **Green Phase**: Implement the minimum code to pass the tests.
> 3.  **Refactor**: Cleanup and optimize while maintaining test integrity.
> 4.  **Checkpoint**: Finalize the task by marking it `[x]` in the `plan.md` with a commit SHA.

## Verification

- Ensure code coverage targets are met.
- Verify that specialized protocols (e.g., fault tolerance) were followed as per the plan's injections.

## Next Step

- After completing all tasks in a phase, use `/review` to validate against project standards.
