# Google Java Style Guide Summary

This document summarizes key rules from the Google Java Style Guide.

## 1. Source File Structure
- **Package Name:** Lowercase, single words (e.g., `com.company.project`).
- **Imports:** Group imports in order: static imports, standard `java` or `javax`, and finally third-party/domain imports. Avoid wildcard imports (`import java.util.*;`).

## 2. Java Language Rules
- **Modifiers:** Keep them in customary order (e.g., `public static final`, not `final static public`).
- **Annotations:** Place annotations on a separate line above the method/class signature.
- **Null Safety:** Use `Optional<T>` over returning `null` where possible, or clearly document `@Nullable`.

## 3. Java Style Rules
- **Line Length:** Maximum 100 characters.
- **Indentation:** 2 spaces (not 4) per indentation level. No tabs.
- **Braces:** K&R style (`{` on the same line, `}` on a new line).
- **Whitespace:** Use whitespace to separate logical blocks. Add a single space around binary operators.
- **Docstrings:** Use Javadoc `/** ... */` for all public classes and methods.

## 4. Naming Conventions
- **Classes/Interfaces:** `PascalCase` (e.g., `DataProcessor`).
- **Methods:** `camelCase` (e.g., `processData`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_ITERATIONS`).
- **Variables/Parameters:** `camelCase`.

**BE CONSISTENT.** When editing code, match the existing style.
*Source: [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)*
