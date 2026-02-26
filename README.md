# Flequit

English | [日本語](./README.ja.md)

Flequit is a local-first task management desktop application built with Tauri and SvelteKit.
It combines SQLite and Automerge to provide responsive local operations while keeping a data model that is ready for future sync extensions.

## Features

- Project, task, and subtask management
- Recurrence rule support in task scheduling
- Local-first data handling with SQLite + Automerge
- Type-safe frontend/backend communication via Tauri commands
- Internationalization with Japanese and English support

## Tech Stack

- Frontend: SvelteKit 2, Svelte 5 runes, Tailwind CSS 4, bits-ui, Inlang Paraglide
- Backend: Tauri 2 (Rust), Sea-ORM, SQLite, Automerge
- Tooling: Bun, Vitest, Playwright, ESLint, Prettier

## Setup

### Prerequisites

- Bun
- Rust toolchain (`rustup`, `cargo`)
- Tauri build prerequisites for your OS
  - Follow: <https://v2.tauri.app/start/prerequisites/>

### Install

```bash
bun install
```

### Run (Desktop Development)

```bash
bun run tauri:dev
```

## Common Commands

```bash
# Frontend type check
bun check

# Frontend lint
bun run lint

# Frontend tests
bun run test [file]
bun run test

# Rust check
cargo check --quiet

# Rust tests
cargo test -j 4

# Build
bun run build
```

## Documentation

- [Development Commands](./docs/en/develop/commands.md)
- [Architecture](./docs/en/develop/design/architecture.md)
- [Tech Stack & Project Structure](./docs/en/develop/design/tech-stack.md)
- [Development Rules](./docs/en/develop/rules/)

## Notes

- Current default runtime is desktop local-first mode.
- Experimental web backend path exists under `src/lib/infrastructure/backends/web` and is disabled by default.

## License

MIT
