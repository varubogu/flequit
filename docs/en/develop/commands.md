# Development Commands

The source of truth is `package.json` (frontend) and each `Cargo.toml` (backend). This document lists only frequently used commands.

## Frontend

| Purpose | Command |
| --- | --- |
| Type check | `bun check` (`bun run check` is not allowed) |
| Lint | `bun run lint` |
| Lint (architecture boundaries) | `bun run lint:arch` |
| Format | `bun run format` |
| Unit/integration tests | `bun run test [file]` -> `bun run test` |
| E2E tests | `bun run test:e2e [file]` (run individual files only) |
| Build | `bun run build` |
| Machine translation | `bun run machine-translate` |
| Tauri dev mode | `bun run tauri:dev` |

> Note: `bun run dev` is prohibited because the user uses it.

## Backend (Rust/Cargo)

| Purpose | Command |
| --- | --- |
| Syntax check | `cargo check --quiet` |
| Warning check | `cargo check` |
| Lint | `cargo clippy` |
| Format | `cargo fmt --all -- --check` |
| Tests | `cargo test -j 4` (`-j 4` is required) |

## Test Preparation

```bash
bun run test:prepare:automerge  # Create Automerge test directories
bun run test:prepare:db         # Prepare SQLite test DB
bun run test:prepare:db:force   # Recreate SQLite test DB
bun run test:prepare            # Run all steps above
```

## Recommended Execution Order (Verification Flow After Changes)

See `docs/en/develop/rules/workflow.md` for detailed steps. Summary:

- **Frontend changes**: `bun check` -> `bun run lint` -> targeted `bun run test` -> `bun run test`
- **Backend changes**: `cargo check --quiet` -> `cargo clippy` -> targeted `cargo test -j 4 <name>` -> `cargo test -j 4`
- **Combined changes**: run frontend checks first, then backend checks
