---
description: Plan a new feature or fix with automated expert guidance. This command transforms your intent into a structured implementation environment.
---

## Usage

```bash
/newTrack <description>
```

> [!TIP]
> This command is **Context-Aware**. It analyzes your description against the `product.md`, `tech-stack.md`, and the full content of the skills library to automatically recommend specific specialists for the task.

## Objective

> [!NOTE]
> 1.  **Architecture Alignment**: Analyze the task to identify necessary engineering expertise.
> 2.  **Expert Injection**: Automatically populate the track's **Plan** and **Spec** with "Recommended Skills" and specialized protocols.
> 3.  **Registry Integration**: Maintain project visibility by linking the new track in the main `index.md`.

## Protocol

1.  **Define Intent**: Briefly describe the task in the command arguments.
2.  **Audit Recommendations**: Review the "Recommended Skills" found message in the terminal.
3.  **Verify Plan**: Check the generated `plan.md` to ensure the suggested specialists align with the task complexity.

## Resulting Artifacts

- **Specification**: Track details including architecture mindsets.
- **Implementation Plan**: Step-by-step tasks with specialized protocols.
- **Track Index**: Status and overview documents.

## Next Step

- Review the generated plan and use `/implement` to begin execution.
