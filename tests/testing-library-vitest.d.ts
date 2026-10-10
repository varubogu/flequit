import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Vitest 5 はカスタムマッチャを `vitest.Matchers<R, T>` から読む。
// `@testing-library/jest-dom` 既定の `jest.Matchers` 拡張はもう参照されない。
declare module 'vitest' {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown
  > extends TestingLibraryMatchers<unknown, R> {}
}
