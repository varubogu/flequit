# Development Commands

## Overview

This is a list of commands used in Flequit project development. Commands necessary for various development tasks in frontend (SvelteKit) and backend (Tauri/Rust) are organized by purpose.

## Development & Build

### TypeScript/SvelteKit

```bash
# Type checking (required after code changes)
bun check

# Project build (including Paraglide translation files)
bun run build

# Tauri desktop app development mode
bun run tauri:dev
```

### Rust/Tauri

```bash
# Error check for all crates (warnings excluded for now)
cargo check --quiet

# Warning check for all crates
cargo check

# Check specific crate only
cargo check -p flequit-storage
cargo check -p flequit-core
cargo check -p flequit

# Run linter
cargo clippy

# Run formatter
cargo fmt --all
```

### Entire Project

```bash
# Full build (frontend + backend)
bun run build && cargo build

# Release build
bun run build && cargo build --release
```

## Testing

### Frontend (Vitest)

```bash
# Run all tests
bun run test

# Run individual file tests
bun run test [filename]

# Watch mode (for development)
bun run test:watch

# Test coverage
bun run test:coverage
```

### E2E Testing (Playwright)

```bash
# Run individual E2E test file (headless)
bun run test:e2e [filename]

# E2E test (with browser display)
bun run test:e2e:headed [filename]

# Note: Full execution is prohibited (only individual file execution)
```

### Backend (Cargo)

```bash
# Run all tests
cargo test

# Run individual test file
cargo test [test-filename]

# Run individual test function
cargo test [function-name]

# Run tests with detailed output
cargo test -- --nocapture

# Disable parallel execution (for database tests)
cargo test -- --test-threads=1
```

### Integration Testing

```bash
# Backend integration tests
cargo test --test integration

# Frontend integration tests
bun run test tests/integration/

# E2E integration tests (individual files only)
bun run test:e2e tests/e2e/integration/
```

## Linter & Formatter

### TypeScript/SvelteKit

```bash
# Run ESLint linter
bun run lint

# ESLint auto-fix
bun run lint:fix

# Prettier formatting
bun run format

# Prettier format check
bun run format:check
```

### Rust

```bash
# Run Clippy linter
cargo clippy

# Clippy strict mode
cargo clippy -- -D warnings

# Run Rustfmt formatter
cargo fmt --all

# Format check
cargo fmt --all -- --check
```

## Internationalization (i18n)

```bash
# Run Inlang machine translation (included in build)
bun run build

# Validate translation files
bun run i18n:validate

# Generate translation files only
bun run i18n:generate

# Check translation status
bun run i18n:status
```

## Database & Migration

### SQLite

```bash
# Run migration
cargo run --bin migrate

# Create migration
cargo run --bin create-migration [migration_name]

# Check migration status
cargo run --bin migration-status

# Setup test database
cargo run --bin setup-test-db
```

### Automerge

```bash
# Verify Automerge document
cargo run --bin verify-automerge

# Repair Automerge document
cargo run --bin repair-automerge

# Check sync status
cargo run --bin sync-status
```

## Debug & Profiling

### Frontend

```bash
# Start development server in debug mode (prohibited - user is using)
# bun run dev

# Bundle analysis
bun run analyze

# Performance analysis
bun run perf:analyze
```

### Backend

```bash
# Debug build
cargo build

# Profiling with release build
cargo build --release
RUST_LOG=debug cargo run --release

# Memory usage analysis
cargo run --release --features memory-profiling

# Performance tests
cargo bench
```

## CI/CD & Deploy

### Local Validation

```bash
# Run checks equivalent to CI environment
./scripts/ci-check.sh

# Run all quality checks
bun check && bun run lint && cargo check && cargo clippy && cargo fmt --all -- --check
```

### Build Validation

```bash
# Production build test
bun run build:production

# Multi-platform build (local)
cargo build --target x86_64-pc-windows-msvc
cargo build --target x86_64-apple-darwin
cargo build --target x86_64-unknown-linux-gnu
```

## Development Support Tools

### Code Generation

```bash
# Create new component template
bun run generate:component [component-name]

# Create new service class
bun run generate:service [service-name]

# Generate Rust model
cargo run --bin generate-model [model-name]
```

### Documentation Generation

```bash
# Generate TypeDoc
bun run docs:generate

# Generate Rust Doc
cargo doc --open

# Generate API specification
bun run api:docs
```

## Troubleshooting

### Dependencies

```bash
# Reinstall node modules
rm -rf node_modules && bun install

# Clear Cargo cache
cargo clean

# Reinstall all dependencies
rm -rf node_modules target && bun install && cargo build
```

### Database

```bash
# Reset test database
cargo run --bin reset-test-db

# Reset development database
cargo run --bin reset-dev-db

# Check database integrity
cargo run --bin verify-db-integrity
```

## Constraints & Notes

### Execution Restrictions

- **Development server**: `bun run dev` is prohibited (user is using)
- **E2E tests**: Full execution prohibited, only individual file execution
- **Test timeout**: Number of tests in file × 1 minute

### Performance Considerations

- Control parallel test execution with `--test-threads`
- Adjust timeout for large data tests
- Adjust batch size considering memory usage

### Security

- Prohibited to develop/test with production data
- Use environment variables for sensitive information like API keys
- Check for sensitive information before committing

## Recommended Workflow

### Frontend Development

1. `bun check` - Type checking
2. `bun run lint` - Linter
3. `bun run test [unit test file]` - Unit tests
4. `bun run test [integration test file]` - Integration tests
5. `bun run test` - All tests
6. `bun run test:e2e [E2E test file]` - E2E tests

### Backend Development

1. `cargo check --quiet` - Error checking
2. `cargo check` - Warning checking
3. `cargo clippy` - Linter
4. `cargo fmt --all` - Formatter
5. `cargo test [unit test file]` - Unit tests
6. `cargo test [integration test file]` - Integration tests
7. `cargo test` - All tests

### When Modifying Both

Follow recommended steps in order: Frontend → Backend
