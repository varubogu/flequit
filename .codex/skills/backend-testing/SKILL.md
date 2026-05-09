---
name: backend-testing
description: Implement and debug Rust/Tauri backend tests with focused execution and Flequit command constraints.
---

# Backend Testing Skill

Use this skill for Rust test creation, failure analysis, and regression prevention.

## Command rules

- Always run backend tests with worker cap: `cargo test -j 4`.
- Start with focused scope (single test/crate), then broaden.

Examples:

- `cargo test test_name -j 4`
- `cargo test -p flequit-core -j 4`
- `cargo test -p flequit-infrastructure-sqlite -j 4`

## Workflow

1. Reproduce with the smallest failing scope.
2. Fix root cause (logic, mock, data setup, or async behavior).
3. Re-run the same focused test.
4. Run wider suite only after focused pass.

## Test design

- Unit tests: isolate service/business logic.
- Integration tests: verify cross-layer behavior with realistic setup.
- Assert both success path and key failure path.
