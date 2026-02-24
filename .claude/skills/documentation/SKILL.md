---
name: documentation
description: Create and update project documentation while keeping Japanese and English versions synchronized.
---

# Documentation Skill

Use this skill when adding or editing docs.

## Critical rule

Update both language versions together unless the user explicitly asks for one side only.

- Japanese: `docs/ja/...`
- English: `docs/en/...`

## Workflow

1. Identify source doc and counterpart path.
2. Apply equivalent structural/content changes to both files.
3. Verify links, headings, and code snippets match intent.
4. Keep terminology consistent across languages.

## Formatting

- Use clear heading hierarchy.
- Keep examples executable and minimal.
- Prefer relative links inside the docs tree.
