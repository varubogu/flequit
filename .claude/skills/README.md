# Flequit Claude Skills

This directory contains project-specific Claude skills for Flequit.

## Skill list

- `frontend-testing`: Frontend testing workflow for Vitest/Svelte 5.
- `backend-testing`: Rust/Tauri backend test workflow.
- `tauri-command`: Tauri command and IPC implementation patterns.
- `architecture-review`: Layer and crate dependency compliance checks.
- `debugging`: Frontend/backend debugging workflow.
- `i18n`: Inlang Paraglide internationalization workflow.
- `documentation`: Documentation editing workflow (ja/en sync).
- `coding-standards`: Coding standards and naming/file checks.

## Usage policy

- Keep these skills in English to reduce context size.
- Keep project-specific rules in `CLAUDE.md` and `docs/en/develop/`.
- Keep reusable cross-project workflows in user-level skills.

## Notes

- Skills are selected based on the user request.
- Keep each `SKILL.md` concise and task-oriented.
