# /review

Validate work against engineering standards and quality gates. This command ensures the track is robust, verified, and ready for archiving.

## Usage

```bash
/review
```

## Objective

1.  **Verification of Standards**: Audit the code against project styleguides and technical requirements.
2.  **Structural Audit**: Verify the integrity of track artifacts and cross-references.
3.  **Gatekeeping**: Prevent incomplete or unverified code from reaching the archive.

## Quality Gates Checklist (Qualitative)

> [!TIP]
> - [ ] **Solution Integrity**: Does the implementation solve the problem described in the specification?
> - [ ] **Architectural Debt**: Does the code follow the **Specialized Protocols** and Mindsets defined for this task?
> - [ ] **Code Hygiene**: Is the code clean, well-named, and free of commented-out blocks or debug logs?
> - [ ] **Documentation**: Have context artifacts been updated to reflect the new state of the project?
> - [ ] **User Sign-off**: Has the user verified the UX and given an explicit "OK"?

## Protocol

> [!IMPORTANT]
> 1.  **Execution**: Run `/review`. This triggers the **Automated Structural & Logic Audit**.
2.  **Peer Review (Mental)**: Evaluate the implementation against the Qualitative Checklist above.
3.  **User Approval**: Present the outcome to the user for final sign-off.

## Next Step

- If the review is successful: Run `/archive`.
- If issues are detected: Addressing them with `/implement`.
