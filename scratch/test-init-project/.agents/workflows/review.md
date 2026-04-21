---
description: Review work against quality gates and project standards
---

# /review

Comprehensive review of completed work against the project's quality gates, style guidelines, and track state requirements. This workflow ensures that code is ready for checkpointing or archiving.

## Usage

```
/review
```

## 1. Automated Verification (run with `CI=true`)

Execute the validation commands defined in the project's tech stack (e.g., `package.json` or `Makefile`):

- **Tests:** All automated tests MUST pass (`npm test`, `pytest`, etc.).
- **Coverage:** Code coverage MUST be >80% (`npm run coverage`).
- **Linting & Formatting:** No linting, formatting, or static analysis errors (`npm run lint`).
- **Type Checking:** Type safety MUST be verified (e.g., `tsc --noEmit`).

## 2. Track State Validation

Verify the structural integrity of the active track:

- [ ] `spec.md` exists and is well-formed.
- [ ] `plan.md` exists, tasks are sequentially marked, and completed tasks correctly reflect their status (e.g. `[x]`).
- [ ] All completed tasks and phases have their associated Git commit SHAs attached as `[checkpoint: <sha>]` or similar inline notes, if applicable.
- [ ] Track appears properly and is linked in `conductor/index.md`.

## 3. Quality Gates Checklist

Before marking any task or phase complete, explicitly verify against the project standards:

- [ ] **Tests Passing**: All unit and integration tests succeed.
- [ ] **Code Coverage**: >= 80% coverage on new and modified code.
- [ ] **Style Guidelines**: Code closely follows project style standards (referenced in `conductor/styleguides/`).
- [ ] **Documentation**: All new public functions, classes, and APIs include comprehensive documentation (docstrings, JSDoc, etc.). Documentation markdown files are updated if architecture or flow changed.
- [ ] **Type Safety**: Proper type hints or TypeScript types are used consistently without unsafe fallbacks (e.g. avoiding `any` or lacking types).
- [ ] **No Security Vulnerabilities**: No hardcoded secrets, unsafe queries, or insecure dependencies.
- [ ] **Code Quality**: DRY principles are applied, logic is concise, and naming conventions are clear and descriptive.

## 4. Manual Verification & UX

As per the Checkpointing Protocol, verify the user experience:

- [ ] **Actionable Plan**: Provide a step-by-step manual verification plan to the user with exact commands and expected outcomes.
- [ ] **User Feedback**: Await explicit user confirmation (`yes` or feedback) before finalizing the review.
- [ ] **Mobile/Responsive**: Ensure the application functions correctly on mobile views (if a frontend change).
- [ ] **Edge Cases**: Both standard functionality and clear, user-friendly error messages are verified for edge cases.

## Next Steps

- If the review **fails**: Address the pending feedback or failing tests.
- If the track is completed and reviewed successfully: Run `/archive`.
- If there are remaining tasks in the phase: Resume work with `/implement`.
