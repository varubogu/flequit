# CLAUDE.md

This file provides guidance for Claude Code (claude.ai/code) when working with the code in this repository.

## Response Guidelines

* Always respond **in Japanese**.
* After loading this file, first say “✅️ CLAUDE.md loaded” and then follow the instructions.

## Design Documents

For detailed design and specifications, please refer to the documents in the `docs` directory:

### Architecture & Design

* `docs/en/develop/design/architecture.md` - Overall architecture
* `docs/en/develop/design/data/` - Data-related design

  * `data-model.md` - Data structure specifications
  * `data-security.md` - Security design
  * `tauri-automerge-repo-dataflow.md` - Data flow design
  * `partial-update-implementation.md` - Partial update system implementation details
* `docs/en/develop/design/frontend/` - Frontend design
* `docs/en/develop/design/database/` - Database design

### Development Rules

* When instructed to make changes, do **not** modify unrelated parts of the source code without first asking for permission from the user.
* When performing replacements using regular expressions or similar methods, always verify beforehand to ensure no unintended effects occur before proceeding with the replacement.
* `docs/en/develop/rules/` - Development rules (backend.md, frontend.md, testing.md, etc.)
* `docs/en/develop/rules/documentation.md` - Documentation editing rules
* Limit the number of workers to **4** during build and test execution for both `bun` and `cargo`, to avoid unintended system load:

  * `cargo test -j 4`
  * `bun run test` (already configured in the settings file; no need for manual adjustment)
* For frontend type checking, use `bun check` (do **not** use `bun run check` or `bun run typecheck`).
* For frontend linting, use `bun run lint` (do **not** use `bun lint`, `bun run check`, or `bun run typecheck`).
* If you get an error saying a file or directory does not exist when executing a command, verify your current working directory with `pwd`.

### Requirements Definition

* `docs/en/develop/requirements/` - Requirement documents (performance.md, security.md, testing.md, etc.)

### Testing

* `docs/en/develop/design/testing.md` - Testing strategy and guidelines

Refer to these documents as needed and ensure your work is always based on the latest design information.
When testing, first execute tests for a single file to confirm correctness, then run the full suite.

* **Web Frontend Tests:** Use `bun run test` (not `bun test`)
* **Tauri Backend Tests:** Use `cargo test -j 4` (always specify `-j 4`)

## Application Overview

A **Tauri-based desktop task management application** that supports project management and task collaboration.
Currently designed for **local operation (SQLite)**, but future updates will support **web and cloud storage synchronization**.
An **AutoMerge-based data management system** is used to prevent conflicts during synchronization.

## Tech Stack

See `docs/en/develop/design/tech-stack.md` for details.

## Project Structure

See `docs/en/develop/design/tech-stack.md` for details.

## Svelte 5 Design Patterns

See `docs/en/develop/design/frontend/svelte5-patterns.md` for details.

## Internationalization System

See `docs/en/develop/design/frontend/i18n-system.md` for details.

## Coding Standards

See `docs/en/develop/rules/coding-standards.md` for details.

### Tauri ⇔ Frontend Communication Rules

**Important:** Tauri automatically converts JavaScript `camelCase` parameters into Rust `snake_case`.

* **JavaScript side:** Use `camelCase` (e.g., `projectId`, `taskAssignment`, `partialSettings`)
* **Rust side:** Use `snake_case` (e.g., `project_id`, `task_assignment`, `partial_settings`)
* **Return values:** Commands returning `void` should return `true` on success and `false` on failure
* **Error handling:** Follow the unified error-handling pattern

For more details, see the “Tauri ⇔ Frontend Communication Rules” section in
`docs/en/develop/rules/coding-standards.md`.

### Rust Guidelines

See `docs/en/develop/design/backend-tauri/rust-guidelines.md` for details.

### Module Relationships

See the “Architecture Structure” section in
`docs/en/develop/design/backend-tauri/rust-guidelines.md` for details.

## Development Workflow

See `docs/en/develop/rules/workflow.md` for details.

## Command List

See `docs/en/develop/commands.md` for details.
