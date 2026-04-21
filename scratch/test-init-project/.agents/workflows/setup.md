---
description: Initialize Conductor project environment
---

# /setup

Initialize the Conductor spec-driven development environment, including directory structure, core documents, and skill registration.

## Usage

```
/setup
```

## What it does

1. Creates the `conductor/` directory structure
2. Generates core project documents:
   - `product.md` - Product definition
   - `product-guidelines.md` - Design principles
   - `tech-stack.md` - Technology choices
   - `workflow.md` - Development process
   - `index.md` - Tracks registry
3. Copies code styleguides from templates
4. Reconciles and registers all installed skills into the `conductor/skills/catalog.md` registry (performs the same logic as `/registerSkill`).

## After Setup

Use `/newTrack` to create your first development track.
