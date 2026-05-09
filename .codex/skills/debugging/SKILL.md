---
name: debugging
description: Debug frontend and backend issues by reproducing reliably, narrowing root causes, and validating fixes.
---

# Debugging Skill

Use this skill for type/runtime errors, failed tests, and IPC issues.

## Workflow

1. Reproduce the issue with a minimal command/scope.
2. Collect concrete signals (error messages, logs, failing assertions).
3. Narrow to one root cause hypothesis at a time.
4. Apply smallest fix and verify.
5. Run adjacent checks to avoid regressions.

## Frontend checks

- Type check: `bun check`
- Lint: `bun run lint`
- Tests: `bun run test [file]`

## Backend checks

- Build/type check: `cargo check --quiet`
- Tests: `cargo test -j 4`

## Tauri IPC checks

- Confirm `@tauri-apps/api/core` import.
- Confirm JS params are `camelCase` and Rust handlers are `snake_case`.
- Validate command registration and return type shape.
