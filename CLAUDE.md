# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Conductor project - a Context Engineering extension for Windsurf that provides a spec-driven development framework. It helps AI agents and developers work together through structured tracks, plans, and quality gates.

## Architecture

The project follows a track-based development approach:
- **Tracks**: Discrete units of work (features, bugs, chores) organized in `conductor/tracks/`
- **Specifications**: Detailed specs for each track in `spec.md` files
- **Implementation Plans**: Step-by-step tasks in `plan.md` files with specialized protocols
- **Commands**: Slash commands for managing the development workflow

## Key Directories

- `src/`: Main source code
  - `src/commands/`: Implementation of slash commands (/setup, /newTrack, /implement, etc.)
  - `src/core/`: Core functionality
  - `src/utils/`: Utility functions for task execution, validation, skills management, etc.
- `conductor/`: Generated directory containing project artifacts (created after running `/setup`)
- `templates/`: Template files for specs and plans
- `dist/`: Compiled JavaScript output

## Commands

The project provides several slash commands:
- `/setup`: Initialize the Conductor environment and create project structure
- `/newTrack <description>`: Create a new development track with spec and plan
- `/implement [track]`: Execute tasks from a track's plan using TDD cycle
- `/status`: Display project progress and track status
- `/review`: Review work against quality gates
- `/revert`: Revert last commit or specific task
- `/archive`: Finalize and preserve a completed track

## Development Workflow

1. Run `/setup` to initialize the Conductor environment
2. Use `/newTrack <description>` to create a new feature track with automated expert guidance
3. Execute `/implement` to begin task execution following the TDD cycle (Red-Green-Refactor)
4. Complete tasks by marking them as `[x]` in the plan.md file
5. Use `/review` to validate work against quality standards before completion

## TDD Implementation Cycle

When implementing tasks, follow the Test-Driven Development cycle:
1. **Red Phase**: Write failing tests for the current task
2. **Green Phase**: Implement minimum code to pass the tests
3. **Refactor**: Optimize code while maintaining test integrity
4. **Checkpoint**: Mark task as complete in `plan.md` with commit SHA

## Building and Testing

```bash
npm run build     # Compile TypeScript to JavaScript
npm run watch     # Watch mode for development
npm run check     # Type check only
npm run lint      # Lint the code
npm run format    # Format code with Prettier
npm test          # Run unit tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Skills System

The project includes an intelligent skills recommendation system that analyzes track requirements against:
- Product definition in `product.md`
- Tech stack in `tech-stack.md`
- Style guides in `styleguides/`
- Workflow processes in `workflow.md`

Recommended skills with specialized protocols are automatically injected into track specifications and implementation plans.