---
description: Archive completed tracks
---

# /archive

Finalize and preserve a completed track. This command marks the end of the lifecycle, moving artifacts to the long-term project memory.

## Usage

```bash
/archive
```

## Objective

> [!NOTE]
> 1.  **Lifecycle Completion**: Move the track directory from `tracks/` to `archive/`.
> 2.  **Registry Update**: Update the project's `index.md` status to `completed`.
> 3.  **Context Cleaning**: Ensure the workspace is ready for the next focus area.

## Protocol

> [!IMPORTANT]
> 1.  **Pre-flight Check**: Ensure `/review` was successful.
2.  **Execution**: Run `/archive`.
3.  **Completion**: The CLI handles artifact preservation and registry updates. The workspace is now ready for a new focus area.

## See Also

- `/status` - View active tracks before archiving
