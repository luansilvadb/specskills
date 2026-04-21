---
description: Revert last commit or specific task
---

# /revert

Revert changes from a track or specific task.

## Usage

```
/revert [last|track <name>|task <name>]
```

## Examples

```
/revert last
/revert track "user authentication"
/revert task "implement login form"
```

## Options

- `last` - Revert the most recently completed task (default)
- `track <name>` - Revert entire track to pending state
- `task <name>` - Revert specific task by description

## Effect

Updates the plan.md task status from `[x]` or `[~]` back to `[ ]`.
