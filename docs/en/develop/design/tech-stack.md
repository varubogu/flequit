# Tech Stack & Project Structure

## Tech Stack

### Frontend

- **Framework**: SvelteKit 2 (Svelte 5 runes)
- **Adapter**: `@sveltejs/adapter-static` (SSG for Tauri)
- **UI**: bits-ui based components
- **Styling**: Tailwind CSS v4
- **i18n**: Inlang Paraglide
- **Package Manager**: Bun
- **Type Check**: `bun check`
- **Lint**: `bun run lint`
- **Tests**: `bun run test`, `bun run test:e2e [file]`

### Backend / Desktop

- **Framework**: Tauri 2
- **Language**: Rust
- **Database**: SQLite (local-first)
- **CRDT**: Automerge
- **Package Manager**: Cargo
- **Type Check**: `cargo check --quiet`
- **Lint**: `cargo clippy`
- **Tests**: `cargo test -j 4`

## Rust Crate Composition

Current workspace crates under `src-tauri/crates`:

- `flequit-types`
- `flequit-model`
- `flequit-repository`
- `flequit-core`
- `flequit-infrastructure`
- `flequit-infrastructure-sqlite`
- `flequit-infrastructure-automerge`
- `flequit-settings`
- `flequit-testing`

Dependency direction rule:

`flequit-types -> flequit-model -> flequit-repository -> flequit-core -> flequit-infrastructure-* -> src-tauri/src/commands`

## Project Structure

```text
(root)
├── src/                             # SvelteKit frontend
│   └── lib/
│       ├── components/              # UI components
│       ├── services/                # domain/composite/ui services
│       ├── stores/                  # state only
│       ├── infrastructure/backends/ # tauri/web backend adapters
│       └── types/
├── src-tauri/                       # Tauri/Rust workspace
│   ├── src/commands/                # Tauri commands
│   └── crates/                      # Rust crates listed above
├── tests/                           # Vitest unit/integration tests
├── e2e/                             # Playwright tests
└── docs/                            # Project documentation
```

## Web Backend Status

`src/lib/infrastructure/backends/web` is experimental and disabled by default.
Enable only for experiments with `PUBLIC_ENABLE_EXPERIMENTAL_WEB_BACKEND=true`.
