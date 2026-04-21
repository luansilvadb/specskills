# Conductor System Audit & Dependency Map

## 1. Directory Structure and Purpose
- **`.agents/workflows/`**: Lightweight command entry structures (slash commands) describing intention and basic usage to the AI (`archive.md`, `implement.md`, `newTrack.md`, etc.).
- **`.agents/templates/`**: Markdown templates for creating `plan.md` and `spec.md`.
- **`conductor/`**: The main orchestration brain containing core documents:
  - `workflow.md`: Massive ruleset (15KB+) defining TDD cycles, checkpointing, track structures, and quality gates. 
  - `product.md`: Product definition source of truth.
  - `product-guidelines.md`: Product heuristics and overarching design goals.
  - `tech-stack.md`: Defined technologies.
  - `index.md`: The active/archived tracks registry.
- **`conductor/styleguides/`**: Contains language-specific coding standards (C++, C#, Dart, Go, HTML/CSS, JS, TS, Python).

## 2. Dependencies and Bindings
- **`/newTrack`** binds dynamically to `conductor/tracks/<id>`, requires `.agents/templates/*`, and modifies `conductor/index.md`.
- **`/implement`** explicitly parses `product.md`, `tech-stack.md`, and heavily relies on reading `workflow.md`. It modifies `conductor/tracks/<id>/plan.md`.
- **`/review`** acts as an intermediary Quality Assurance checklist, explicitly verifying `spec.md` and `plan.md` states against `workflow.md` quality gates.

## 3. Duplicate Guidelines Identified (Fragmentation Focus)
1. **Code Coverage Rules (>80%)**: Mentioned in `workflow.md` (twice: guiding principles and quality gates), repeatedly checked in `review.md`, and also restated in `product-guidelines.md`.
2. **User Experience Prioritization**: Sits both in `workflow.md` (Guiding principles) and `product-guidelines.md` (Design Principles: User First).
3. **TDD Sequence instructions**: Short-listed in `/implement` (Red phase, green phase) but comprehensively spelled out in massive detail inside `workflow.md`.
4. **Styleguide References**: `workflow.md` says "in `code_styleguides/`" (sic), but the directory is actually named `conductor/styleguides/`.
5. **Language Noise**: Storing 9 different programming language styleguides directly in the workspace creates noise if the project stack (`tech-stack.md`) is restricted, leading AI context astray.

## 4. Proposed Deduplication (For Phase 2)
- Remove general workflow & dev principles from `product-guidelines.md` (keep it purely product-design-oriented).
- Correct faulty paths (`code_styleguides/` -> `conductor/styleguides/`) in `workflow.md`.
- Strip repetitive Quality Gates from workflows like `review.md` and `implement.md` to cleanly refer to `workflow.md` as the single source, OR strip them from `workflow.md` and maintain them inside the AI's specific slash-commands. Opting to centralize into `workflow.md` as the SSOT (Single Source of Truth) is safer.
- Shrink `workflow.md` text bloat while preserving robust test/checkpoint protocols.