---
description: Maintain the integrity and discovery signals of the expert skill library. This command synchronizes your physical skill files with the semantic recommendation engine.
---

## Usage

```bash
/registerSkill
```

> [!NOTE]
> This command is automatically executed during `/setup`. Use it manually to refresh the engine after adding new `.md` specialists manually.

## Objective

> [!NOTE]
> 1.  **Library Integrity**: Perform a **Self-Healing** audit of the `catalog.md` registry.
> 2.  **Semantic Indexing**: Extract goals, triggers, and protocols from skill files into the discovery engine.
> 3.  **Autonomous Synchronization**: Ensure that new specialists are immediately available for recommendation in `/newTrack`.

## Protocol

1.  **Skill Placement**: Add your new specialist directory or `.md` file to `conductor/skills/`.
2.  **Indexing**: Run `/registerSkill` to reconcile the library.
3.  **Verification**: Check `conductor/skills/catalog.md` to confirm your skill is registered with the correct version and signals.

## Next Step

- Your new skill is now "online". Try running `/newTrack` with a prompt related to the skill's content to verify discovery.
