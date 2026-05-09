# AGENTS.md

Project-specific guidance for Codex in this repository. Claude Code uses `CLAUDE.md` instead.

## Response Guidelines

- Always respond in Japanese.
- After loading this file, first print `✅️ AGENTS.md loaded`.
- Keep `AGENTS.md` and skill files primarily in English to reduce context size.

## Core Rules

- Use **Bun only**; do not use npm/yarn/pnpm.
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`); do not introduce Svelte 4 syntax.
- Use Tauri invoke from `@tauri-apps/api/core`; JS params are `camelCase`, Rust params are `snake_case`.
- Keep frontend boundaries: components go through `services/`; stores do not import services/infrastructure.
- Keep backend dependency order: `flequit-types → flequit-model → flequit-repository → flequit-core → flequit-infrastructure-* → src-tauri/src/commands`.
- Do not change unrelated code unless the user explicitly approves.
- Verify scope and side effects before broad regex-style replacements.
- If a command fails with missing path/file errors, check `pwd` first.

## Critical Commands

- Frontend: `bun check`, `bun run lint`, `bun run test [file]` then `bun run test`
- Backend: `cargo check --quiet`, `cargo test -j 4` (always cap workers)
- Build/i18n: `bun run build`, `bun run machine-translate`

## Codex Skills

- Repo-local skills live under `.codex/skills/`; use them for task-specific details.
- Use `project-orientation` for app overview, tech stack, docs index, and scope policy.
- Use focused skills for frontend/backend tests, Tauri commands, architecture review, debugging, i18n, documentation, and coding standards.
- Reusable cross-project procedures belong in user-level skills (`~/.codex/skills/`), not this repo.
