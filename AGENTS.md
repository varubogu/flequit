# AGENTS.md

Project-specific guidance for AI coding agents (Codex, etc.) working in this repository. Claude Code uses `CLAUDE.md` instead.

## Response Guidelines

- Always respond in Japanese.
- After loading this file, first print `✅️ AGENTS.md loaded`.
- Write `AGENTS.md` and skill files primarily in English to reduce context size.

## Scope Policy

- Project-specific constraints: this file + `docs/`
- Reusable cross-project procedures: user-level Codex skills (`~/.codex/skills/`)
- Treat Codex skills as user-scoped; do not embed repo-specific rules in shared skills.

## Application Overview

- Tauri-based desktop task management app with project/task collaboration
- Local-first (SQLite) currently; future web/cloud sync planned
- Automerge-based data handling for sync conflict reduction

## Tech Stack

- Frontend: SvelteKit 2 (SSG), Svelte 5 runes, Tailwind CSS 4, bits-ui, Inlang Paraglide
- Backend: Tauri 2 (Rust), Sea-ORM, SQLite, Automerge (CRDT)
- Package manager: **Bun only** (no npm/yarn/pnpm)
- Type generation: Specta (Rust → TypeScript)

Details: `docs/ja/develop/design/tech-stack.md`.

## Architecture Rules (Summary)

### Frontend layers

- `components/` → only `services/`
- `services/domain/` → backend calls + single-entity ops
- `services/composite/` → cross-entity orchestration
- `services/ui/` (deprecated) → UI orchestration only (no invoke)
- `stores/` → state only (no invoke, no services import)
- `infrastructure/backends/tauri/` → IPC adapters (not imported by components)

### Backend dependency order

`flequit-types → flequit-model → flequit-repository → flequit-core → flequit-infrastructure-* → src-tauri/src/commands`

## Tauri ↔ Frontend Communication

- JS params: `camelCase` (Tauri auto-maps to Rust `snake_case`)
- Rust command params: `snake_case`
- Success/failure return: `Result<bool, String>` by default
- Frontend invoke import: `@tauri-apps/api/core`

## Svelte 5 Rules

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- Do not introduce Svelte 4 syntax (`export let`, `$:`, etc.)

## Critical Commands

- Frontend typecheck: `bun check` (not `bun run check`)
- Frontend lint: `bun run lint`
- Frontend tests: `bun run test [file]` then `bun run test`
- Backend tests: `cargo test -j 4` (always include `-j 4`)
- Rust check: `cargo check --quiet`
- Build: `bun run build`
- Machine translate: `bun run machine-translate`

## Testing Policy

- Run single-file/single-target tests first, then broader suites
- Backend test workers must be capped: `cargo test -j 4`

## Documentation Policy

- Keep Japanese (`docs/ja/`) and English (`docs/en/`) aligned when updating
- ⚠️ Current state: `docs/ja/` was just refactored; `docs/en/` is pending sync (separate task). Reference `docs/ja/` as the source of truth until sync completes.
- Follow `docs/ja/develop/rules/documentation.md`

## Non-Negotiable Development Rules

- Do not change unrelated code unless the user explicitly approves
- Verify scope and side effects before broad regex-style replacements
- If a command fails with missing path/file errors, check `pwd` first

## Primary References (post-refactor)

- Architecture & design: `docs/ja/develop/design/`
- Development rules: `docs/ja/develop/rules/`
- Requirements: `docs/ja/develop/requirements/`

Frequently used files:

- `docs/ja/develop/design/architecture.md`
- `docs/ja/develop/design/tech-stack.md`
- `docs/ja/develop/design/frontend/svelte5-patterns.md`
- `docs/ja/develop/design/frontend/i18n-system.md`
- `docs/ja/develop/design/backend-tauri/rust-guidelines.md`
- `docs/ja/develop/rules/coding-standards.md`
- `docs/ja/develop/rules/frontend.md` / `backend.md` / `testing.md` / `workflow.md`
- `docs/ja/develop/commands.md`
