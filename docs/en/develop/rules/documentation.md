# Documentation Editing Rules

## Naming Rules

- Use hyphen-separated names by default (kebab-case).
- Exception: when a file name corresponds to an actual DB table name or similar, match the real name.
- If a name contains spaces, replace them with hyphens or underscores before saving (do not save names with spaces).

## Multilingual Support

- The structure and content of `docs/ja/` (Japanese) and `docs/en/` (English) must match.
- Normally update both at the same time. Updating only one side is prohibited.
- Translate appropriately without relying on machine translation.
- Exception: for large restructures, `ja` may lead and `en` may follow in a separate task. See skill `documentation/SKILL.md`.

## Editing Procedure

1. Edit the Japanese version
2. Edit the English version with corresponding content (or in the sync task)
3. Confirm both versions match
4. Confirm related document links are not broken
