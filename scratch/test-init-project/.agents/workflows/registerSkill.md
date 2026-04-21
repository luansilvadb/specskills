---
description: Reconciles and registers all installed skills into the catalog.md
---

# /registerSkill

Reconciles the skills catalog with all skills currently installed in the `conductor/skills/` directory.

## Usage

```
/registerSkill
```

> [!NOTE]
> This command is automatically executed during the initial project setup via `/setup`. Use it manually to update the catalog after adding new skills.

## What it does

1. Scans the `conductor/skills/` directory for skill definitions.
2. Identifies all subdirectories that represent individual skills.
3. Performs a **Smart Reconciliation** with the `conductor/skills/catalog.md` file.
4. **Self-Healing**: If `catalog.md` is missing or corrupted, it will be automatically regenerated.
5. Updates or adds skill descriptions, signals, and recommendation settings based on the source files.

## When to use

- After adding a new skill to the `conductor/skills/` directory.
- When you want to ensure the AI agent can automatically discover and recommend existing skills.
- To repair a corrupted `catalog.md` file.
