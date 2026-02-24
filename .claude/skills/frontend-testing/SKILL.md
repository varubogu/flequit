---
name: frontend-testing
description: Implement and debug frontend tests for TypeScript/Svelte 5 with Vitest and Testing Library.
---

# Frontend Testing Skill

Use this skill for frontend unit/component/integration tests.

## Command rules

- Start from single-file scope: `bun run test [file]`
- Expand after stability: `bun run test`
- Type check with `bun check` (not `bun run check` / `bun run typecheck`)

## Workflow

1. Reproduce failing test in the smallest scope.
2. Fix test or implementation with minimal change.
3. Re-run focused test until stable.
4. Run broader suite.

## Test patterns

- Use Arrange-Act-Assert.
- Keep tests independent (`beforeEach` reset/setup).
- Mock unstable external boundaries, not core logic.
- Assert user-observable behavior for Svelte components.
