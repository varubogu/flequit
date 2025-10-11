# Tech Stack & Project Structure

## Tech Stack & Architecture

### Frontend

- **SvelteKit**: Main framework (using Svelte 5 + runes)
- **Adapter**: `@sveltejs/adapter-static` (SSG) - Static site generation for Tauri
- **UI**: shadcn-svelte (bits-ui based) - Maintain originality as much as possible
- **Styling**: Tailwind CSS v4 + custom CSS variables
- **Internationalization**: Inlang Paraglide (English/Japanese support)
- **Icons**: Lucide Svelte
- **Package Manager**: bun
- **Build Tool**: Vite
- **Type Checking**: TypeScript + svelte-check
- **Formatter**: Prettier
- **Linter**: ESLint
- **Testing**: Vitest (unit) + @testing-library/svelte (integration) + Playwright (E2E)

### Backend & Desktop

- **Tauri**: Desktop application framework
- **Rust**: Backend logic
- **SQLite**: Local database
- **Automerge**: History management and synchronization for local database
- **Package Manager**: cargo
- **Build Tool**: cargo
- **Type Checking**: cargo check
- **Formatter**: rustfmt
- **Linter**: clippy
- **Testing**: cargo test

## Project Structure

```
(root)
├── e2e/           # E2E tests
│   ├── components/  # E2E tests for Svelte components
├── src/          # Source code
│   ├── lib/
│   │   ├── components/          # Svelte components
│   │   │   ├── ui/             # shadcn-svelte basic components (maintain originality)
│   │   │   ├── shared/         # Common components
│   │   │   └── [feature]/      # Feature-specific components
│   │   ├── services/           # Business logic (API communication, data operations)
│   │   ├── stores/             # Svelte 5 runes-based state management
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Pure helper functions
│   ├── routes/                 # SvelteKit routing
│   ├── paraglide/              # Internationalization (auto-generated, not in Git)
│   ├── app.css                 # Global styles + Tailwind configuration
│   └── app.html                # HTML template
├── src-tauri/                  # Tauri source code
│   ├── capabilities/           # Tauri security configuration
│   ├── icons/                  # App icons
│   ├── crates/                 # Separated crates
│   │   ├── flequit-storage/    # Storage layer crate
│   │   │   ├── src/
│   │   │   │   ├── errors/             # Error types
│   │   │   │   ├── models/             # Data models
│   │   │   │   │   ├── command/        # Command models
│   │   │   │   │   └── sqlite/         # SQLite models
│   │   │   │   ├── repositories/       # Repository implementations
│   │   │   │   │   ├── cloud_automerge/ # Cloud Automerge
│   │   │   │   │   ├── local_automerge/ # Local Automerge
│   │   │   │   │   ├── local_sqlite/    # Local SQLite
│   │   │   │   │   ├── web/             # Web server
│   │   │   │   │   ├── unified/         # Unified layer
│   │   │   │   │   └── *_trait.rs       # Repository trait definitions
│   │   │   │   ├── types/              # Type definitions
│   │   │   │   └── utils/              # Storage utilities
│   │   │   ├── tests/              # Storage layer tests
│   │   │   ├── build.rs            # Test database creation
│   │   │   └── Cargo.toml
│   │   └── flequit-core/           # Business logic layer crate
│   │       ├── src/
│   │       │   ├── facades/            # Facade layer
│   │       │   └── services/           # Service layer
│   │       └── Cargo.toml
│   ├── src/                    # Main application
│   │   ├── commands/           # Tauri commands (minimal configuration)
│   │   ├── logger.rs           # Log configuration
│   │   └── lib.rs              # Entry point
│   ├── target/
│   ├── build.rs
│   ├── Cargo.lock
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/                    # Unit & integration tests (vitest)
│   ├── test-data/            # Test data for unit & integration tests (vitest) (1 function = 1 test data generation)
│   ├── integration/          # Integration tests
│   ├── */                    # Unit tests
│   └── vitest.setup.ts       # Vitest configuration
```
