import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Vitest 5 はカスタムマッチャを `vitest.Matchers<R, T>` から読む。
// `@testing-library/jest-dom` 既定の `jest.Matchers` 拡張はもう参照されない。
declare module 'vitest' {
  // vitest.Matchers は空インターフェースで、宣言マージでのみマッチャを追加できる。
  // type alias にするとマージできず、メンバーを足すと既存のマッチャ型が変わる。
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    _T = unknown
  > extends TestingLibraryMatchers<unknown, R> {}
}
