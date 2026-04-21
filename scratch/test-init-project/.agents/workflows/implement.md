---
description: Execute tasks from a track's plan
---

# /implement

Execute the implementation plan for a track, following the workflow protocol.

## Usage

```
/implement [track-description]
```

## Examples

```
/implement
/implement user authentication
```

## Without Arguments

If no track is specified, automatically selects the next incomplete track.

## Workflow Protocol

1. **Mark In Progress**: Updates track status to `[~]`
2. **Load Context**: Reads product, tech stack, and workflow docs
3. **Identify Tasks**: Shows current and pending tasks
4. **Execute**: Guides through implementation following TDD

## Quality Gates

- Write failing tests first (Red phase)
- Implement to pass tests (Green phase)
- Refactor with passing tests
- Mark tasks complete with commit hash
