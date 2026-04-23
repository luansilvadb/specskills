# Conductor - Multi-Platform Context Engineering Framework

Context Engineering extension for various AI-assisted development environments - A spec-driven development framework.

## 🎭 Overview

Conductor helps AI agents and developers work together through structured tracks, plans, and quality gates. It transforms ad-hoc AI coding sessions into organized, trackable, and premium development workflows. Now supporting multiple platforms!

## ✨ Features

- **Multi-Platform Support**: Works with Claude Code, Agent Systems, and CLI
- **Track-Based Development**: Organize work into discrete tracks (features, bugs, chores)
- **Spec-Driven Planning**: Each track has a specification and implementation plan
- **Intelligent Resolution**: Smart track selection based on current context
- **Premium CLI Output**: Vibrant and clear progress reporting with emojis and sections
- **Quality Gates**: Built-in checklists for code review and testing
- **Cross-Platform Integration**: Native commands for Claude, workflows for agents, and CLI tools

## 🚀 Installation

```bash
npm install @mondrakebr1/specskills
```

Upon installation, you'll be prompted to select your preferred platform:
- **Claude Code**: For Claude Code integration with slash commands
- **Agent Systems**: For workflow automation and agent integration
- **CLI**: For command-line interface

## 🛠️ Platform-Specific Commands

### Claude Code Platform
| Command | Description |
|---------|-------------|
| `/setup` | Initialize Conductor environment |
| `/newTrack` | Create a new development track |
| `/implement` | Execute tasks from a track's plan |
| `/status` | Display project progress & "Resolve" summary |
| `/review` | Review work against quality gates |
| `/revert` | Revert last commit or specific task |

### Agent Systems Platform
| Workflow | Description |
|----------|-------------|
| `setup.md` | Initialize Conductor environment |
| `newTrack.md` | Create a new development track |
| `implement.md` | Execute tasks from a track's plan |
| `status.md` | Display project progress |
| `review.md` | Review work against quality gates |
| `archive.md` | Archive completed tracks |

### CLI Platform
| Command | Description |
|---------|-------------|
| `conductor setup` | Initialize Conductor environment |
| `conductor new-track` | Create a new development track |
| `conductor implement` | Execute tasks from a track's plan |
| `conductor status` | Display project progress |
| `conductor review` | Review work against quality gates |
| `conductor archive` | Archive completed tracks |

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

Platform-specific configurations:
```
.claude/                 # Claude Code integration
├── commands/            # Custom slash commands
├── templates/           # Claude-specific templates
└── settings.local.json  # Claude settings

.agents/                 # Agent Systems integration
├── workflows/           # Automation workflows
└── templates/           # Agent-specific templates

bin/                    # CLI executables
config/                 # CLI configuration
```

## 🏎️ Quick Start

1. **Install**: `npm install @mondrakebr1/specskills` (select your platform)
2. **Setup**: Run platform-appropriate command:
   - Claude: `/setup`
   - Agent: Use `setup.md` workflow
   - CLI: `conductor setup`
3. **Create Track**: Run platform-appropriate command
   - Claude: `/newTrack Implement feature X`
   - Agent: Use `newTrack.md` workflow
   - CLI: `conductor new-track Implement feature X`
4. **Implement**: Execute tasks following platform conventions
5. **Review**: Run platform-appropriate review command before completing

## 💻 Development

```bash
npm run watch    # Watch mode
npm run check    # Type check
npm run lint     # Lint code
npm run format   # Format code
```

## 🌐 Cross-Platform Compatibility

- Tracks created on one platform can be used on another
- Core templates and configurations are shared
- Platform-specific customizations enhance experience
- Data and settings can be migrated between platforms

## 📜 License

MIT
