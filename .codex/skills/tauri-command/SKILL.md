---
name: tauri-command
description: Implement Tauri command handlers and frontend invoke calls with consistent naming, conversion, and error handling.
---

# Tauri Command Skill

Use this skill for new or modified Tauri IPC commands.

## Naming and mapping

- Frontend invoke params: `camelCase`
- Rust command args/fields: `snake_case`
- Tauri maps `camelCase` -> `snake_case` automatically for command params.

## Frontend rules

- Use `import { invoke } from '@tauri-apps/api/core'`.
- Keep backend access in infrastructure/domain service layers, not UI components.

## Rust handler rules

- Add `#[instrument]` to command handlers.
- Validate/convert boundary IDs early.
- Acquire shared repository state correctly before facade/service calls.
- Keep handlers thin; delegate business logic.

## Return shape guidance

- Mutation success/failure: `Result<bool, String>`
- Single item fetch: `Result<Option<T>, String>`
- List fetch: `Result<Vec<T>, String>`
