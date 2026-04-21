# Technology Stack

## Core Technologies

The Conductor framework is built as a TypeScript-based CLI and context engine.

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Core Engine | TypeScript | ^5.3.0 | Type-safe logic and CLI commands |
| Runtime | Node.js | >=18.0.0 | Execution environment |
| Testing | Vitest | ^4.1.4 | Unit and integration testing |
| Parsing | YAML | ^2.3.0 | Configuration and metadata parsing |

## Dependencies

### Required
- `yaml`: For handling structured metadata in tracks.

### Development
- `typescript`: Core language.
- `vitest`: Testing framework.
- `eslint`: Code linter.
- `prettier`: Code formatter.
- `rimraf`: Build cleanup utility.

## Architecture Decisions

- **File-Based State**: Project state is stored in `.md` files to be human-readable and AI-parseable.
- **Track Isolation**: Each piece of work is isolated in its own directory to prevent context pollution.
- **TypeScript**: Chosen for robustness and better DX when building complex logic.

## Change Log

| Date | Change | Rationale |
|------|--------|-----------|
| 2026-04-21 | Initial Setup | Project initialization via /setup command. |