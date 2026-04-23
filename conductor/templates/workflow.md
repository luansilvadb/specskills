# Project Workflow

## Guiding Principles

- **The Plan is the Source of Truth:** All work must be tracked in `plan.md`.
- **Test-Driven Development:** Write tests before implementing.
- **High Code Coverage:** Aim for >80% code coverage.

## Task Workflow

1. **Select Task:** Choose the next available task from `plan.md`
2. **Write Failing Tests (Red Phase)**
3. **Implement to Pass Tests (Green Phase)**
4. **Commit Changes**
5. **Mark Complete:** Update task from `[ ]` to `[x]`

## Quality Gates

Before marking any task complete, verify:
- [ ] All tests pass
- [ ] Code coverage meets requirements (>80%)
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
