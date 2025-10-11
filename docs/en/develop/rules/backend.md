# Backend-specific Coding Rules

## About Rust Components

### Option Type Handling

- When extracting values from Option, use `if let Some` for single cases, but for multiple cases, store in temporary variables to avoid deep nesting

## Module Relationships

### Tauri-side Architecture

Adopts Clean Architecture

```text
Application Layer Events (commands, controllers, events, etc.)
↓
Domain Layer (facade is called, and may call multiple services from there)
↓
Data Access Layer (repository, implemented as sqlite, automerge, etc.)
```

### Access Control Rules

- **commands**: facade is OK, commands, service, repositories are NG
- **facade**: service is OK, facade, commands, repositories are NG
- **service**: service and repository are OK, commands, facade are NG
- **repository**: only within repository is OK, external access is NG

## Development Workflow

For details, refer to `docs/develop/rules/workflow.md`.
