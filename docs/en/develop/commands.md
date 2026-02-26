# Development Commands

## Overview

This document lists currently valid commands for this repository.
The source of truth is:

- Frontend: `package.json` scripts
- Backend: `src-tauri/Cargo.toml` and each crate `Cargo.toml`

## Frontend (Bun)

```bash
# Type check (required after code changes)
bun check

# Lint
bun run lint

# Architecture boundary lint (src/lib only)
bun run lint:arch

# Format
bun run format

# Unit/Integration tests (Vitest)
bun run test [file]
bun run test
bun run test:watch
bun run test:ui

# E2E tests (Playwright: run targeted files first)
bun run test:e2e [file]
```

## Backend (Rust/Cargo)

```bash
# Rust checks
cargo check --quiet
cargo check
cargo clippy
cargo fmt --all
cargo fmt --all -- --check

# Tests (always include -j 4)
cargo test -j 4
cargo test -j 4 <test_name>
cargo test -j 4 --test <integration_name>
cargo test -j 4 -- --nocapture
```

## Test Preparation Helpers

```bash
# Prepare Automerge test directories
bun run test:prepare:automerge

# Prepare SQLite test database (runs migration_runner)
bun run test:prepare:db

# Recreate SQLite test database from scratch
bun run test:prepare:db:force

# Run all preparation steps
bun run test:prepare
```

## Desktop App (Tauri)

```bash
# Tauri dev mode
bun run tauri:dev

# Tauri command passthrough
bun run tauri
```

## Build and i18n

```bash
# Frontend build
bun run build

# Machine translation for localization resources
bun run machine-translate
```

## Recommended Execution Order

### Frontend changes

1. `bun check`
2. `bun run lint`
3. `bun run test [file]`
4. `bun run test`
5. `bun run test:e2e [file]` (when needed)

### Backend changes

1. `cargo check --quiet`
2. `cargo check`
3. `cargo clippy`
4. `cargo fmt --all -- --check`
5. `cargo test -j 4 <test_name>`
6. `cargo test -j 4`

### Combined changes

Run frontend checks first, then backend checks.
