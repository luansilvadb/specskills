---
description: Archive completed tracks
---

# /archive

Move completed tracks to the archive folder.

## Usage

```
/archive <track-id>
```

## Example

```
/archive cep-lookup
```

## Workflow Steps

1. **Pre-flight Checks**:
   - Verify `conductor/tracks/<track-id>/` exists.
   - Verify all tasks in `plan.md` are marked complete or explicitly skipped.
2. **Move Directory**:
   - Move `conductor/tracks/<track-id>/` to `conductor/archive/<track-id>/`.
   - *Fallback*: If target directory already exists in archive, gracefully rename the old one or merge cautiously.
3. **Registry Update**:
   - Parse `conductor/index.md`.
   - Remove `<track-id>` from **Active Tracks**.
   - Ensure the correct format when adding to **Completed Tracks** (e.g., `[track-id](./archive/track-id/) | ... | ✅ Complete`).
   - Validate that no rows were accidentally corrupted during this update.

## See Also

- `/status` - View active tracks before archiving
