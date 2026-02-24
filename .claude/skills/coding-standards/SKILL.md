---
name: coding-standards
description: Validate Flequit coding standards including naming, file structure, typing discipline, and error handling patterns.
---

# Coding Standards Skill

Use this skill to check or align code with project conventions.

## Naming

- TypeScript: `camelCase` for vars/functions, `PascalCase` for types/components.
- Rust: `snake_case` for vars/functions, `PascalCase` for types/enums.
- Constants: `SCREAMING_SNAKE_CASE`.
- File and directory names: `kebab-case` unless framework conventions require otherwise.

## File structure

- Avoid oversized files; split by responsibility when practical.
- Keep one clear responsibility per file/module.

## Typing

- Avoid `any` unless explicitly justified.
- Model optional vs required fields clearly.
- Keep return types and DTO/domain boundaries explicit.

## Error handling

- Handle expected failure paths explicitly.
- Do not swallow exceptions silently.
- Keep error messages actionable and consistent.
