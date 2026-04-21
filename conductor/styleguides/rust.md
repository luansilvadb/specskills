# Rust Code Style Guide Summary

This document summarizes key rules and best practices for writing Rust code.

## 1. Rust Language Rules
- **Safety First:** Minimize the use of `unsafe` blocks. Document any invariants required by `unsafe` code.
- **Error Handling:** Use `Result` and `Option` instead of panic. Use the `?` operator for propagation.
- **Ownership & Borrowing:** Prefer borrowing (`&T` or `&mut T`) over taking ownership unless the function needs to own the data. 
- **Lifetimes:** Let the compiler elide lifetimes where possible.

## 2. Rust Style Rules
- **Line Length:** Standard is 100 characters per line.
- **Indentation:** 4 spaces per indentation level. Avoid tabs.
- **Formatting:** Use `rustfmt` standard settings. Run `cargo fmt` regularly.
- **Comments:** Use `///` for documentation comments on public items (structs, functions, modules). Use `//` for inline code blocks.
- **Clippy:** Regularly run `cargo clippy` and fix the reported warnings.

## 3. Naming
- **General:** `snake_case` for modules, functions, methods, and local variables.
- **Structs/Enums:** `CamelCase` (PascalCase).
- **Traits:** `CamelCase`.
- **Constants & Statics:** `SCREAMING_SNAKE_CASE`.

## 4. Organization
- Group imports sensibly (standard library `std`, external crates, internal modules).
- Favor small, focused modules. Extract large blocks of logic into separate files.

**BE CONSISTENT.** When editing code, match the existing style.
*Source: [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)*