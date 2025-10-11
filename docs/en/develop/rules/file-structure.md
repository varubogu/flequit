# File Structure & Project Structure

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
│   ├── capabilities/           # ???
│   ├── icons/                  # App icons
│   ├── src/                    # Tauri source code
│   │   ├── commands/           # Tauri commands invoked from frontend via invoke
│   │   ├── errors/             # Error type storage
│   │   ├── models/             # Model definitions
│   │   │   ├── command/        # Command models
│   │   │   └── sqlite/         # SQLite model definitions and migrations
│   │   ├── repositories/                 # Repository definitions
│   │   │   ├── cloud_automerge/          # Repository definitions for reading/writing data with cloud storage Automerge
│   │   │   ├── local_automerge/          # Repository definitions for reading/writing data with local Automerge
│   │   │   ├── local_sqlite/             # Repository definitions for reading/writing data with local SQLite
│   │   │   ├── web/                      # Repository definitions for saving to web server
│   │   │   ├── base_repository_trait.rs  # Base repository definitions (CRUD operations, etc.)
│   │   │   └── XXXX_repository_trait.rs  # Feature-specific base repository definitions (project_repository_trait, etc.)
│   │   ├── services/                     # Service definitions
│   │   │   └── xxxx_service.rs           # Feature-specific service definitions (project_service, etc.)
│   │   ├── types/          # type, enum, etc. type definitions (structs defined in models)
│   │   └── utils/          # Generic helper function groups
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
