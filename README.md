# Conductor

Context Engineering extension for Windsurf - A spec-driven development framework.

## 🎭 Overview

Conductor helps AI agents and developers work together through structured tracks, plans, and quality gates. It transforms ad-hoc AI coding sessions into organized, trackable, and premium development workflows.

## ✨ Features

- **Track-Based Development**: Organize work into discrete tracks (features, bugs, chores)
- **Spec-Driven Planning**: Each track has a specification and implementation plan
- **Intelligent Resolution**: Smart track selection based on current context
- **Premium CLI Output**: Vibrant and clear progress reporting with emojis and sections
- **Quality Gates**: Built-in checklists for code review and testing
- **Windsurf Integration**: Native slash commands for seamless workflow

## 🚀 Installation

```bash
npm install
npm run build
```

## 🛠️ Slash Commands

| Command | Description |
|---------|-------------|
| `/setup` | Initialize Conductor environment |
| `/newTrack` | Create a new development track |
| `/implement` | Execute tasks from a track's plan |
| `/status` | Display project progress & "Resolve" summary |
| `/review` | Review work against quality gates |
| `/revert` | Revert last commit or specific task |

## 📂 Project Structure

```
conductor/
├── index.md              # Tracks registry
├── product.md            # Product definition
├── product-guidelines.md # Design principles
├── tech-stack.md         # Technology stack
├── workflow.md           # Development workflow
├── styleguides/          # Language-specific guides
└── tracks/
    └── <track-id>/
        ├── index.md      # Track overview
        ├── spec.md       # Specification
        └── plan.md       # Implementation plan
```

## 🏎️ Quick Start

1. **Setup**: Run `/setup` to initialize
2. **Create Track**: Run `/newTrack Implement feature X`
3. **Implement**: Run `/implement` to start working
4. **Review**: Run `/review` before completing

## 💻 Development

```bash
npm run watch    # Watch mode
npm run check    # Type check
npm run lint     # Lint code
npm run format   # Format code
```

## 📜 License

MIT
