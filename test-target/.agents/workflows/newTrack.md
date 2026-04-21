---
description: Create a new development track
---

# /newTrack

Create a new track (feature, bug fix, or chore) with specification and implementation plan.

## Usage

```
/newTrack <description>
```

## Examples

```
/newTrack Implement user authentication
/newTrack Fix login redirect bug
/newTrack Add dark mode support
```

## What it creates

1. Track directory in `conductor/tracks/<track-id>/`
2. `spec.md` - Track specification
3. `plan.md` - Implementation plan with phases
4. `index.md` - Track overview
5. Updates main tracks registry

## Next Steps

Use `/implement` to start working on the track.
