## Development Workflow

### Recommended Procedures

Basic rules for PR operations:
- Include documentation changes when related to design decisions for changes (mark N/A if not applicable)
- Describe "Applied patterns/Avoided anti-patterns" in PR description (refer to PR template)
- Meet review checklist requirements (refer to component-patterns / anti-patterns)

If errors occur during the process, proceed to the next step after resolution

#### When Modifying Frontend (SvelteKit) Code

1. Code editing
2. Create vitest unit test cases
3. `bun check` - Run type checking
4. `bun run lint` - Run linter
5. `bun run test [unit test filename]` - Run vitest unit tests
6. Create vitest integration test cases
7. `bun run test [integration test filename]` - Run vitest integration tests
8. `bun run test` - Run all vitest tests
9. Create Playwright (E2E) test cases
10. `bun run test:e2e [E2E test filename]` - Run E2E tests (individual files only, do not run all)

##### Detailed Procedures

###### 1. Code Editing
- **Confirm implementation approach**: Check related design documents (`docs/develop/design/frontend/`)
- **Analyze existing code**: Understand structure of files to be modified and related files
- **Implement incrementally**: Implement in small units and verify operation each time
- **Ensure type safety**: Implement with TypeScript type checking in mind
- **When not working**:
  - Check errors in browser developer tools
  - Use `bun run dev` for immediate confirmation via hot reload
  - Add debug logs with console.log, etc.
  - Check impact scope by running related existing tests

###### 2. Create vitest Unit Test Cases
- **Identify test targets**: List public interfaces of functions and components created/modified
- **Design test cases**:
  - Normal cases: Confirm correct output for expected input
  - Abnormal cases: Confirm behavior under error conditions and boundary values
  - Edge cases: Confirm behavior with special values like null, undefined, empty strings
- **Create test files**: Follow naming convention of `*.test.ts` or `*.spec.ts`
- **When tests cannot be written**:
  - Complex dependencies in target code → Consider mocking
  - Dependencies on external APIs → Mock with MSW, etc.
  - UI component testing → Rendering tests with Testing Library

###### 6. Create vitest Integration Test Cases
- **Identify integration test targets**: Confirm coordination between multiple components, integration with stores, etc.
- **Scenario-based tests**: Design test cases following user operation flows
- **Data flow tests**: Confirm series of processes from input to output
- **When integration tests become complex**:
  - Difficult test environment setup → Create test helper functions
  - Heavy use of async processing → Unify await/async patterns
  - Complex state management → Implement test initial state reset functionality

###### 9. Create Playwright (E2E) Test Cases
- **Determine E2E test targets**: Limit to important UI features and main user operation flows
- **Scenario design**: Test design close to actual user operations
- **Test data preparation**: Prepare mock data and test environment
- **Problem handling in E2E tests**:
  - Unstable tests → Add appropriate waiting (waitFor, etc.)
  - Environment-dependent issues → Standardize test environment
  - Long test execution time → Focus on minimal necessary test cases

#### When Modifying Tauri Code

1. Code editing
2. `cargo check --quiet` - Check for errors (exclude warnings for now)
3. `cargo check` - Check for warnings
4. `cargo clippy` - Run linter
5. `cargo fmt --all` - Run formatter
6. `cargo test [unit test filename]` - Run cargo unit tests
7. Create cargo integration test cases
8. `cargo test [integration test filename]` - Run cargo integration tests
9. `cargo test` - Run all cargo tests

##### Detailed Procedures

###### 1. Code Editing
- **Check design documents**: Check related documents in `docs/develop/design/backend-tauri/`
- **Analyze existing code**: Understand dependencies and structure of modules to be modified
- **Focus on error handling**: Implement safely using Rust's type system
- **Ensure memory safety**: Implement with ownership system in mind
- **When not working**:
  - Check compiler error messages in detail
  - Resolve errors step by step with `cargo check`
  - Add debug output with `println!` or `dbg!` macros
  - Verify operation in small units with unit tests
  - Refer to related documents and Rust official documentation

###### 6. Create cargo Unit Test Cases
- **Identify test targets**: Confirm operation of functions and methods created/modified
- **Design test cases**:
  - Normal cases: Correct output for expected input
  - Error handling: Appropriate handling of Result type Err cases
  - Boundary value tests: Confirm behavior with max values, min values, empty data, etc.
- **When tests cannot be written**:
  - Many external dependencies → Consider abstraction with traits and mocking
  - Async processing → Set up test environment with tokio::test
  - File I/O → Use tempfile crate for temporary files

###### 7. Create cargo Integration Test Cases
- **Identify integration test targets**: Coordination between modules, integration with databases, etc.
- **Design test scenarios**: Test cases following actual usage patterns
- **Build test environment**: Prepare test databases, configuration files, etc.
- **When integration tests become complex**:
  - Database dependencies → Prepare test migrations
  - External service dependencies → Mock with wiremock, etc.
  - Configuration file dependencies → Create test-specific configurations

#### When Modifying Both Codes

Follow recommended procedures in order: Frontend, then Tauri
