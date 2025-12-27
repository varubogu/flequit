# CLAUDE.md

This file provides guidance for Claude Code (claude.ai/code) when working with the code in this repository.

## Response Guidelines

* Always respond **in Japanese**.
* After loading this file, first say "✅️ CLAUDE.md loaded" and then follow the instructions.

## Application Overview

A **Tauri-based desktop task management application** that supports project management and task collaboration.

**Tech Stack**:
- Frontend: SvelteKit (SSG) + Svelte 5 + Inlang Paraglide
- Backend: Tauri (Rust) + SQLite + Automerge
- Architecture: Clean Architecture (Crate separation)

## Important Development Rules

* When instructed to make changes, do **not** modify unrelated parts of the source code without first asking for permission from the user.
* When performing replacements using regular expressions or similar methods, always verify beforehand to ensure no unintended effects occur before proceeding with the replacement.
* If you get an error saying a file or directory does not exist when executing a command, verify your current working directory with `pwd`.

## Documentation & Skills

Claude Code has specialized **skills** for common tasks. These skills provide detailed guidance:

* **`.claude/skills/frontend-testing/`** - Frontend testing (Vitest, Svelte 5)
* **`.claude/skills/backend-testing/`** - Backend testing (Rust, cargo)
* **`.claude/skills/tauri-command/`** - Tauri command implementation
* **`.claude/skills/architecture-review/`** - Architecture compliance check
* **`.claude/skills/debugging/`** - Debugging support
* **`.claude/skills/i18n/`** - Internationalization (Inlang Paraglide)
* **`.claude/skills/documentation/`** - Documentation editing (ja/en)
* **`.claude/skills/coding-standards/`** - Coding standards check

For detailed design and specifications, refer to the documents in the `docs` directory:

* **Architecture & Design**: `docs/en/develop/design/`
  * `architecture.md` - Overall architecture
  * `tech-stack.md` - Tech stack and project structure
  * `frontend/` - Frontend design (Svelte 5, i18n, layers, etc.)
  * `backend-tauri/` - Backend design (Rust guidelines, transactions, etc.)
  * `data/` - Data design (models, security, Automerge, etc.)

* **Development Rules**: `docs/en/develop/rules/`
  * `coding-standards.md` - Coding standards
  * `frontend.md` - Frontend rules
  * `backend.md` - Backend rules
  * `testing.md` - Testing rules
  * `documentation.md` - Documentation editing rules (MUST update both ja/en)

* **Requirements**: `docs/en/develop/requirements/`
  * `performance.md`, `security.md`, `testing.md`, etc.

Refer to these documents and skills as needed. Skills will be automatically invoked based on your tasks.
