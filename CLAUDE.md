# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Response Guidelines

- Always respond **in Japanese**.
- After loading this file, first say "✅️ CLAUDE.md loaded" and then follow the instructions.

## Application Overview

A **Tauri-based desktop task management application** with project/task collaboration.

**Tech stack** (canonical source: `package.json` / `src-tauri/Cargo.toml`):

- Frontend: SvelteKit 2 (SSG) + Svelte 5 (runes) + Tailwind CSS 4 + bits-ui + Inlang Paraglide
- Backend: Tauri 2 (Rust) + Sea-ORM + SQLite + Automerge (CRDT)
- Package manager: **Bun** (do not use npm / yarn / pnpm)
- Type generation: Specta (Rust → TypeScript)
- Architecture: Clean Architecture (crate separation)

## Critical Rules

- When instructed to make changes, do **not** modify unrelated source code without first asking the user for permission.
- When performing replacements using regex or similar methods, always verify before applying to ensure no unintended effects.
- If a command errors with "file/directory does not exist", verify the working directory with `pwd`.
- Frontend invoke path is `@tauri-apps/api/core` (the old `@tauri-apps/api/tauri` is forbidden).
- Components must not import from `infrastructure/` directly; go through `services/`.
- Stores must not import services or infrastructure (cycle prevention).

## Key Commands (summary)

See `docs/ja/develop/commands.md` for details.

- Typecheck: `bun check` (not `bun run check`)
- Frontend tests (single file): `bun run test [file]`, then full run `bun run test`
- Backend tests: `cargo test -j 4` (`-j 4` is required)
- Machine translate: `bun run machine-translate`

## Skills (auto-loaded when relevant tasks fire)

- `frontend-testing`: Vitest / Svelte 5 frontend testing
- `backend-testing`: Rust / cargo backend testing
- `tauri-command`: Tauri command implementation and invoke conventions
- `architecture-review`: Layer / crate dependency compliance checks
- `debugging`: Debugging support
- `i18n`: Inlang Paraglide internationalization
- `documentation`: Documentation editing (ja/en sync policy)
- `coding-standards`: Naming / typing / error handling conventions

## Documentation Index

Design and specifications live under `docs/ja/develop/` (treat ja as the source of truth; `docs/en/` will be synced in a separate task).

- **Design**: `docs/ja/develop/design/`
  - `architecture.md` - Overall architecture
  - `tech-stack.md` - Tech stack
  - `frontend/` - Layers / Svelte 5 / Store & Service / i18n
  - `backend-tauri/` - Rust guidelines / Transactions
  - `data/` - Data model / Automerge / Security / Entity definitions
  - `api/api.md` - Future Web API design
- **Rules**: `docs/ja/develop/rules/`
  - `coding-standards.md` - Cross-language conventions
  - `frontend.md` / `backend.md` / `testing.md` / `documentation.md` / `workflow.md`
  - `general.md` / `file-structure.md`
- **Requirements**: `docs/ja/develop/requirements/`
  - `performance.md` / `accessibility.md` / `usability.md` / `data-management.md` / `non-functional.md` / `testing.md`
- **Commands**: `docs/ja/develop/commands.md`

Skill files link to the relevant docs so any required information is at most one hop away.
