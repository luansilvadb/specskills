# PHP Style Guide Summary (PSR-12/PER Coding Style)

This document summarizes key rules following the PHP-FIG recommendations.

## 1. PHP Language Rules
- **Tags:** Always use `<?php` and `?>`. For files containing only PHP, omit the closing `?>` tag.
- **Types:** Use strict typing where possible (`declare(strict_types=1);`). Use parameter and return type hints actively.
- **Namespaces:** Each class must be in a namespace. There must be one blank line after the namespace declaration.

## 2. Style & Formatting Rules
- **Line Length:** Recommended soft limit of 120 characters, aiming for 80 characters.
- **Indentation:** 4 spaces. Do not use tabs.
- **Braces:** 
  - Classes/Methods: Opening brace on a new line, closing brace on a new line.
  - Control Structures: Opening brace on the same line, closing brace on a new line.
- **Visibility:** Must be declared on all properties and methods (`public`, `protected`, `private`).
- **Keywords:** All PHP keywords and types must be written in lowercase.

## 3. Naming Conventions
- **Classes/Interfaces/Traits:** `PascalCase`.
- **Constants:** `UPPER_SNAKE_CASE`.
- **Methods:** `camelCase`.
- **Variables:** `camelCase` or `snake_case` depending on project legacy, but `camelCase` is preferred for modern projects.

## 4. Documentation
- **PHPDoc:** Use `/** ... */` for documenting classes, methods, and properties to assist static analysis tools (e.g., PHPStan, Psalm).

**BE CONSISTENT.** When editing code, match the existing style.
*Source: [PHP-FIG PSR-12](https://www.php-fig.org/psr/psr-12/)*
