# Specification: Improve Conductor Resolve

## Overview

The "Conductor Resolve" process is how the Conductor system identifies the current state of work (active track, current task) and presents it to the agent/developer. Currently, this process is functional but lacks the "WOW" factor and clarity requested by the user.

Goals:

1. **Bring more clarity**: Better visual feedback in terminal/logs.
2. **Intuitiveness**: Make it obvious what needs to be done next without complex parsing.
3. **Simplicity**: Streamline the "resolution" logic and directory structure if possible.

## Requirements

- Update `/implement` command to provide a more visual and clear implementation guide.
- Update `/status` command to show a "premium" status report with better progress visualization.
- Standardize the naming of the context directory (Conductor vs Conductor).
- Simplify the "resolution" logic: if no track is specified, the system should intelligently find the most relevant one based on recency or "in_progress" status.

## Acceptance Criteria

- [ ] `/implement` output is easy to read and shows clear next steps.
- [ ] `/status` shows a percentage progress and clear track breakdown.
- [ ] Logic for finding the active track is robust and handles empty/corrupt files gracefully.
- [ ] Directory structure is intuitive (standardizing on `conductor/` if that's the user preference).

## Technical Notes

- Use emojis and markdown headers effectively in CLI output.
- Consolidate directory resolution logic in `src/utils/fileSystem.ts`.
- Ensure the `parseTracksIndex` in `src/utils/markdown.ts` is robust.