# Ruby Style Guide Summary

This document summarizes key rules and best practices for Ruby development.

## 1. Ruby Language Rules
- **Idiomatic Code:** Prefer Ruby built-ins and core logic. Favor `map`, `select`, `reduce` over traditional loops.
- **Symbols vs. Strings:** Use symbols (`:symbol`) instead of strings for hash keys and identifiers.
- **Return Value:** Rely on Ruby's implicit return. Do not use the `return` keyword unless returning early.
- **Error Handling:** Rescue specific exceptions, never capture `Exception` directly.

## 2. Style Rules
- **Line Length:** Keeping lines under 80-100 characters is recommended.
- **Indentation:** 2 spaces per indentation level. Never use tabs.
- **Blocks:** Use `{...}` for single-line blocks; use `do...end` for multi-line blocks.
- **Quotes:** Prefer single quotes (`'`) for pure strings. Use double quotes (`"`) only when using string interpolation.

## 3. Naming
- **Classes/Modules:** `CamelCase` (e.g., `AdminUser`).
- **Methods:** `snake_case` (e.g., `calculate_tax`). Check methods ending in `?` (returns boolean) or `!` (mutates state or raises error).
- **Variables:** `snake_case`.
- **Constants:** `SCREAMING_SNAKE_CASE`.

## 4. Tools
- **RuboCop:** Use RuboCop for linting and formatting. Ensure configurations are defined in `.rubocop.yml`.

**BE CONSISTENT.** When editing code, match the existing style.
*Source: [Ruby Style Guide](https://rubystyle.guide/)*