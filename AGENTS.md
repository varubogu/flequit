# AGENTS.md

Project-specific guidance for AI coding agents working in this repository.

## Response Guidelines

- Always respond in Japanese.
- Right after loading this file, print `✅️ AGENTS.md loaded` first.
- Write `AGENTS.md` and skill files primarily in English to reduce context size.

## Scope Policy (Important)

- Store project-specific constraints in this file and `docs/`.
- Store reusable, cross-project procedures in user-level Codex skills (`~/.codex/skills/`).
- Treat Codex skills as user-scoped; do not embed repository-specific rules in shared skills.

## Application Overview

- Tauri-based desktop task management app with project/task collaboration.
- Current mode is local-first (SQLite), with future web/cloud sync support.
- Uses Automerge-based data handling to reduce sync conflicts.

## Tech Stack

- Frontend: SvelteKit 2 (SSG), Svelte 5 runes, Tailwind CSS 4, bits-ui, Inlang Paraglide
- Backend: Tauri 2 (Rust), Sea-ORM, SQLite, Automerge (CRDT)
- Package manager: Bun only (do not use npm/yarn/pnpm)
- Type safety: Specta (Rust -> TypeScript type generation)

See `docs/en/develop/design/tech-stack.md` for details.

## Architecture Rules

### Frontend Layers

- `src/lib/components/` may depend on `services/` only.
- `src/lib/services/domain/` handles single-entity operations and backend calls.
- `src/lib/services/composite/` handles cross-entity orchestration.
- `src/lib/services/ui/` handles UI orchestration only (no invoke).
- `src/lib/stores/` handles state only (no invoke, no services import).
- `src/lib/infrastructure/backends/tauri/` contains IPC adapters (not imported directly by components).

### Backend Dependency Order

`flequit-types` -> `flequit-model` -> `flequit-repository` -> `flequit-core` -> `flequit-infrastructure-*` -> `src-tauri/src/commands`

## Tauri <-> Frontend Communication

- Use `camelCase` in JavaScript/TypeScript parameters.
- Use `snake_case` in Rust command parameters.
- Tauri maps JS `camelCase` to Rust `snake_case` automatically.
- Command handlers that return success/failure should use `Result<bool, String>` by default.
- Frontend invoke import must be `@tauri-apps/api/core`.

## Svelte 5 Rules

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`).
- Do not introduce new Svelte 4 syntax (`export let`, `$:`, etc.).

## Critical Commands

- Frontend typecheck: `bun check` (do not use `bun run check` or `bun run typecheck`)
- Frontend lint: `bun run lint` (do not use `bun lint`)
- Frontend tests: `bun run test [file]` then `bun run test`
- Backend tests: `cargo test -j 4` (always include `-j 4`)
- Rust check: `cargo check --quiet`
- Build: `bun run build`
- Machine translate: `bun run machine-translate`

## Testing Policy

- Run single-file/single-target tests first, then run broader suites.
- Always keep backend test workers capped with `cargo test -j 4`.

## Documentation Policy

- Keep Japanese and English docs aligned when updating project documentation.
- Follow `docs/en/develop/rules/documentation.md`.

## Non-Negotiable Development Rules

- Do not change unrelated code unless the user explicitly approves.
- Before broad regex-style replacements, verify scope and side effects.
- If a command fails with missing path/file errors, check `pwd` first.

## Primary References

- Architecture & design: `docs/en/develop/design/`
- Development rules: `docs/en/develop/rules/`
- Requirements: `docs/en/develop/requirements/`
- Testing strategy: `docs/en/develop/design/testing.md`

Frequently used files:

- `docs/en/develop/design/architecture.md`
- `docs/en/develop/design/tech-stack.md`
- `docs/en/develop/design/frontend/svelte5-patterns.md`
- `docs/en/develop/design/frontend/i18n-system.md`
- `docs/en/develop/design/backend-tauri/rust-guidelines.md`
- `docs/en/develop/rules/coding-standards.md`
- `docs/en/develop/rules/frontend.md`
- `docs/en/develop/rules/backend.md`
- `docs/en/develop/rules/testing.md`
- `docs/en/develop/rules/workflow.md`
- `docs/en/develop/commands.md`
