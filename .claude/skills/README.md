# Flequit Claude Skills

Project-specific Claude skills for Flequit.

## Skill list

| Skill | Purpose | Entry doc |
| --- | --- | --- |
| `frontend-testing` | Vitest / Svelte 5 test workflow | `docs/ja/develop/rules/testing.md` |
| `backend-testing` | Rust / Tauri backend test workflow | `docs/ja/develop/rules/testing.md` |
| `tauri-command` | Tauri command + IPC implementation | `docs/ja/develop/design/backend-tauri/rust-guidelines.md` |
| `architecture-review` | Layer + crate dependency compliance | `docs/ja/develop/design/frontend/layers.md`, `docs/ja/develop/design/backend-tauri/rust-guidelines.md` |
| `debugging` | Frontend / backend debugging workflow | - |
| `i18n` | Inlang Paraglide internationalization | `docs/ja/develop/design/frontend/i18n-system.md` |
| `documentation` | Documentation editing (ja/en sync policy) | `docs/ja/develop/rules/documentation.md` |
| `coding-standards` | Coding standards / naming / typing checks | `docs/ja/develop/rules/coding-standards.md` |

## Usage policy

- Keep these skills in **English** to reduce context size.
- Project-specific rules live in `CLAUDE.md` and `docs/ja/develop/`.
- Reusable cross-project workflows belong in user-level skills (`~/.claude/skills/`).
- Skills are auto-selected based on the user request.
- Each `SKILL.md` should remain concise and task-oriented; details belong in `docs/ja/`.

## Notes on doc references

- ja docs were just refactored. `docs/en/` is pending sync (separate task). Reference `docs/ja/` as authoritative.
- Code examples have been removed from `docs/ja/design/` and `docs/ja/data/`. Source code (`src/`, `src-tauri/`) is the canonical implementation reference. Code examples are kept only in `docs/ja/rules/` files.
