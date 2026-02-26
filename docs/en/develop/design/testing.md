# Testing Environment

## Current Configuration

- **Test Runner**: vitest (unit tests, integration tests), Playwright (E2E tests)
- **Test Types**: Utility functions, business logic, integration tests, Svelte components

## Dependencies

- **@playwright/test**: E2E test framework
- **vitest**: Unit tests, integration tests
- **@testing-library/svelte**: Svelte component testing
- **jest-dom**: Provides matchers for DOM nodes

## Execution Commands

### Frontend (Vitest)

- `bun run test` - Run all Vitest tests
- `bun run test [filename]` - Run individual Vitest file tests
- `bun run test:watch` - Vitest watch mode
- `bun run test:e2e [filename]` - Playwright E2E tests (individual files only, headless)

### Backend (Rust Crates)

- `cargo test -j 4` - Run all crate tests
- `cargo test --lib -p flequit-infrastructure-sqlite -j 4` - SQLite infrastructure layer only
- `cargo test --lib -p flequit-core -j 4` - Core business logic layer only

## Test File Structure

### Frontend

```
e2e/                   # E2E tests (Playwright)
├── components/        # Svelte component tests
├── scenario/          # Scenario tests simulating actual user usage
tests/                 # Unit tests, integration tests (vitest)
├── utils/             # Utility function tests
├── integration/       # Integration tests
├── **/                # Unit tests ※ Test with same structure as actual source code (src/)
└── vitest.setup.ts    # Vitest-specific configuration
```

### Backend

```
src-tauri/crates/flequit-infrastructure-sqlite/tests/      # SQLite infrastructure tests
src-tauri/crates/flequit-infrastructure-automerge/tests/   # Automerge infrastructure tests
src-tauri/crates/flequit-repository/tests/                 # Repository layer tests
src-tauri/crates/flequit-settings/tests/                   # Settings layer tests
```

## Writing Vitest Tests

```typescript
// Basic test
import { test, expect } from 'vitest';

test('example test', () => {
  expect(1 + 1).toBe(2);
});

// Using mocks
import { test, expect, vi } from 'vitest';

test('mock test', () => {
  const mockFn = vi.fn();
  mockFn('test');
  expect(mockFn).toHaveBeenCalledWith('test');
});

// Svelte component test
import { test, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import MyComponent from '../src/lib/components/MyComponent.svelte';

test('component test', async () => {
  const mockCallback = vi.fn();
  const { getByRole } = render(MyComponent, {
    props: { onClick: mockCallback }
  });

  await fireEvent.click(getByRole('button'));
  expect(mockCallback).toHaveBeenCalledTimes(1);
});
```

## Svelte 5 Component Testing

✅ **Full Support**: Component tests including Svelte 5 runes (`$state`, `$props`) work correctly

### Test Support Status

1. **Utility function tests** ✅
2. **Business logic tests** ✅
3. **Integration tests** ✅
4. **Svelte component tests** ✅

## Translation System Testing

### Mocking Translation System During Tests

Use the following pattern for unit tests in Vitest:

#### Correct Approach

Use `setTranslationService()` in `beforeEach` to mock:

```typescript
import { test, expect, beforeEach } from 'vitest';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService, unitTestTranslations } from '../unit-translation-mock';

beforeEach(() => {
  setTranslationService(createUnitTestTranslationService());
});

test('Test function requiring translation', () => {
  expect(getStatusLabel('not_started')).toBe(unitTestTranslations.status_not_started);
});
```

#### Key Points

1. **Use `createUnitTestTranslationService()`**: Dedicated service provided from `tests/unit-translation-mock.ts`
2. **Compare using property references**: Use `unitTestTranslations.some_key` (not string literals)
3. **No need for `afterEach` restoration**: Vitest runs each file independently
4. **Avoid global mocks**: Do not mock translation-related items in `vitest.setup.ts`

#### Approaches to Avoid

- Direct mocking of `$paraglide/runtime`
- Full mocking of `$lib/stores/locale.svelte`
- Translation-related global mocks in `vitest.setup.ts`

These depend on internal implementation of the translation system, making tests fragile.

#### Features of unitTestTranslations

- Provides unique test values for all translation keys
- Unlike actual translations, different keys always have different values
- Easy to distinguish in tests and detect incorrect key usage

## Test Strategy

1. **Unit tests**: Utility functions, business logic
2. **Integration tests**: Data flow, service interactions
3. **E2E tests**: To be added in the future with Playwright, etc.
