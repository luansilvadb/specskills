# Specification: Conductor Stability & Polish

## Background
The Conductor system has evolved quickly, leading to some inconsistencies in directory structure, registry management, and document formatting. To ensure long-term stability and ease of use, these elements need to be standardized.

## Goals
- **Single Source of Truth**: Consolidate multiple track registries into a single, unified `conductor/index.md`.
- **Consistent Directory Structure**: Define and enforce a clear hierarchy for active and archived tracks.
- **Improved Templates**: Provide standardized templates for `spec.md` and `plan.md` to ensure high-quality documentation for all new tracks.
- **UI/UX Refinement**: Improve the visual presentation of status tables and progress reports.

## Deliverables
1. **Unified Registry**: A revamped `conductor/index.md` that tracks all active and completed work.
2. **Standardized Directory Layout**:
   ```
   conductor/
   ├── archive/              # Historically completed tracks
   ├── styleguides/          # Coding and style standards
   ├── tracks/               # CURRENTLY active tracks only
   ├── index.md              # MAIN REGISTRY
   └── workflow.md           # GLOBAL WORKFLOW PROTOCOL
   ```
3. **Template Library**: A set of reusable markdown templates in `.agents/templates/`.

## Success Criteria
- No redundant registries (only one `index.md` for all tracks).
- All track tables follow the same column format.
- Archive process is clearly defined and consistent.