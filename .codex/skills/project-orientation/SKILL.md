---
name: project-orientation
description: Orient Codex to Flequit repository context, including application overview, tech stack, architecture references, documentation index, and scope policy. Use when starting broad codebase work, deciding where to look, or updating project guidance.
---

# Project Orientation Skill

Use this skill to load repository context without bloating `AGENTS.md`.

## Scope policy

- Project-specific constraints live in `AGENTS.md` and `docs/`.
- Project-specific task procedures live in repo-local Codex skills: `.codex/skills/`.
- Reusable cross-project procedures belong in user-level skills: `~/.codex/skills/`.
- Do not embed repo-specific rules in shared user-level skills.

## Application overview

- Tauri-based desktop task management app with project/task collaboration.
- Local-first SQLite app today; future web/cloud sync is planned.
- Automerge-based data handling reduces sync conflicts.

## Tech stack

- Frontend: SvelteKit 2 SSG, Svelte 5 runes, Tailwind CSS 4, bits-ui, Inlang Paraglide.
- Backend: Tauri 2, Rust, Sea-ORM, SQLite, Automerge CRDT.
- Package manager: Bun only.
- Type generation: Specta from Rust to TypeScript.

Details: `docs/ja/develop/design/tech-stack.md`.

## Primary references

- Architecture and design: `docs/ja/develop/design/`
- Development rules: `docs/ja/develop/rules/`
- Requirements: `docs/ja/develop/requirements/`
- Commands: `docs/ja/develop/commands.md`

Frequently used files:

- `docs/ja/develop/design/architecture.md`
- `docs/ja/develop/design/tech-stack.md`
- `docs/ja/develop/design/frontend/svelte5-patterns.md`
- `docs/ja/develop/design/frontend/i18n-system.md`
- `docs/ja/develop/design/backend-tauri/rust-guidelines.md`
- `docs/ja/develop/rules/coding-standards.md`
- `docs/ja/develop/rules/frontend.md`
- `docs/ja/develop/rules/backend.md`
- `docs/ja/develop/rules/testing.md`
- `docs/ja/develop/rules/workflow.md`
