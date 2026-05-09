---
name: documentation
description: Create and update project documentation while keeping Japanese and English versions synchronized.
---

# Documentation Skill

Use this skill when editing files under `docs/`.

## Sync policy

- **Default**: keep `docs/ja/` and `docs/en/` aligned in structure and content. Update both in the same change.
- **Exception (current state)**: `docs/ja/` was recently refactored / reduced. `docs/en/` is **pending a separate sync task**. Until sync is complete:
  - Treat `docs/ja/` as the source of truth.
  - Do not blindly regenerate `docs/en/` from `docs/ja/`; that is the dedicated sync task's responsibility.
  - When adding new content as part of an unrelated change, add to `docs/ja/` and add a TODO note for `docs/en/` sync.

## Editing rules

- Follow `docs/ja/develop/rules/documentation.md`:
  - File names: kebab-case (exception: filenames that mirror DB table names use the table name)
  - Spaces in filenames are not allowed (use hyphen or underscore)
- Avoid duplicate content across files; cross-reference instead.
- Code examples in `docs/`:
  - **Allowed**: `docs/ja/develop/rules/` files (these documents are coding rules and benefit from examples)
  - **Allowed**: table design (field tables, constraint tables, indexed columns) in `entity/` files
  - **Removed**: SQL DDL examples, Sea-ORM code, TypeScript interface examples, Rust service code in design/ docs — replace with `src/lib/...:42 参照` style references.
- For multi-file consolidations (entity merges, etc.), record migration source paths in commit messages.

## Workflow

1. Identify source doc and counterpart path (if cross-language).
2. Apply equivalent structural/content changes (or note the en sync as a separate TODO).
3. Verify links, headings, and references match intent.
4. Keep terminology consistent across languages.
5. Prefer relative links inside the docs tree.
