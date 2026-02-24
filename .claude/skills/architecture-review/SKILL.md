---
name: architecture-review
description: Check Flequit architecture compliance, including frontend layer boundaries and backend crate dependency rules.
---

# Architecture Review Skill

Use this skill when reviewing whether code follows Flequit architecture constraints.

## Frontend checks

- `components/` should depend on `services/` only.
- `services/domain/` may call backend adapters/invoke.
- `services/ui/` should orchestrate UI state only (no invoke).
- `stores/` should manage state only (no invoke, no services import).
- `infrastructure/backends/tauri/` should not be imported directly by components.

## Backend checks

Expected dependency order:

`types -> model -> repository(traits) -> core -> infrastructure -> tauri commands`

- Tauri commands should call core facades, not repository implementations directly.
- Avoid circular dependencies between facades/services.
- Keep infrastructure crates independent from app-layer concerns.

## Review output format

1. Violations with concrete file paths.
2. Why each violation is risky.
3. Minimal fix proposal per violation.
