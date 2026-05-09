# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.
A Japanese mirror of this file is kept at `CLAUDE_ja.md` for human readers; keep both in sync when editing.

## Response Guidelines

- Always respond in **Japanese**.
- After loading this file, first say `✅️ CLAUDE.md loaded`, then follow the instructions.

## Project

Tauri-based desktop task management app.
Frontend: SvelteKit 2 + Svelte 5 (runes) + Tailwind 4 + bits-ui + Inlang Paraglide.
Backend: Tauri 2 (Rust) + Sea-ORM + SQLite + Automerge (CRDT).
Clean Architecture (crate separation) + Specta (Rust → TS type generation).

- Package manager: **Bun** (do not use npm / yarn / pnpm).

## Critical Rules

- Do not modify unrelated code without asking the user first.
- For regex / bulk replacements, always review the diff before applying.
- On "file/directory not found" errors, check `pwd` first.

## Pointers

- Design / rules / requirements / commands: `docs/ja/develop/{design,rules,requirements,commands.md}`
- `docs/ja/` is the source of truth; `docs/en/` sync is a separate task.
- Task-specific guidance lives in skills (testing / tauri-command / architecture-review / i18n / documentation / coding-standards / debugging) which auto-trigger — do not duplicate skill content here.
