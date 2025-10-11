# Testing-related Coding Rules

## Test Types and Placement

### Frontend
- **Unit Tests**:
  - Test Framework: Vitest
  - Location: tests/unit/
- **Integration Tests**:
  - Test Framework: @testing-library/svelte + Vitest
  - Location: tests/integration/
- **E2E Tests**:
  - Command: bun run test:e2e
  - Test Framework: Playwright
  - Location: e2e/

### Backend
- **Unit Tests**:
  - Command: cargo test
  - Test Framework: cargo test
  - Location: Test blocks within same source code
- **Integration Tests**:
  - Command: cargo test
  - Test Framework: cargo test
  - Location: src-tauri/tests/integration
- **System Tests**:
  - Command: cargo test
  - Test Framework: cargo test
  - Location: src-tauri/tests/system

## Test Data Management

- **Test Data**: Placed in `tests/test-data/` directory
- **Basic Principle**: 1 function = 1 test data generation

## Test Execution Rules

### Important Constraints
- **E2E Tests**: Very resource-intensive, full execution prohibited, only individual file execution
- **Test Timeout**: Number of tests in file × 1 minute

### Test Commands

#### Frontend
- `bun run test` - Run all Vitest tests
- `bun run test [filename]` - Run individual Vitest file tests
- `bun run test:watch` - Vitest watch mode
- `bun run test:e2e [filename]` - Playwright E2E tests (individual files only, headless)

#### Backend
- `cargo test` - Run all cargo tests
- `cargo test [filename]` - Run individual cargo file tests

## Test Design Principles

### External File Usage Tests
- For tests using external files, create test files and folders according to test cases under `.tmp/tests/` with execution date/time folders.
  Example:
    `test_error_handling_and_edge_cases` in `<project_root>/src-tauri/tests/integration/local_automerge_repository_test.rs` executed at `2021/09/10 12:34:56`
    ↓
    `<project_root>/.tmp/tests/cargo/integration/local_automerge_repository_test/test_error_handling_and_edge_cases/20210910_123456/`
- For tests using Automerge, output JSON snapshots to json_history folder for each edit in addition to automerge files
- When running test builds, prepare SQLite files with the following steps regardless of test targets:
  1. Create `<project_root>/.tmp/tests/test_database.db` and run migrations. (This process is performed "exactly once" "always" regardless of which tests are run or how many tests are run)
  2. For tests using SQLite, copy the file created in step 1 to each test folder (`<project_root>/.tmp/tests/...`) for use
  This minimizes the number of migrations.

- No cleanup is performed after tests to avoid conflicts by outputting test target files as described above

### Frontend
- When creating component unit tests, do not mock external UI libraries
- Mock everything except external UI libraries
- Mock `getTranslationService()` when running vitest (unit tests)

### Internationalization System Testing
- For details, refer to the "Translation System Testing" section in `docs/develop/design/testing.md`
