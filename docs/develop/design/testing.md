# テスト環境

## 現在の構成

- **テストランナー**: vitest（単体テスト、結合テスト）、Playwright（E2Eテスト）
- **テスト種類**: ユーティリティ関数、ビジネスロジック、統合テスト、Svelteコンポーネント

## 依存パッケージ

- **@playwright/test**: E2Eテストフレームワーク
- **vitest**: 単体テスト、結合テスト
- **@testing-library/svelte**: Svelteコンポーネントのテスト
- **jest-dom**: DOMノードに対するマッチャーを提供

## 実行コマンド

- `bun run test` - Vitest全テスト実行
- `bun run test [ファイル名]` - Vitest個別ファイルテスト
- `bun run test:watch` - Vitestウォッチモード
- `bun run test:e2e [ファイル名]` - Playwright E2Eテスト（個別ファイルのみ、ヘッドレス）

## テストファイル構成

```
e2e/                   # E2Eテスト（Playwright）
├── components/        # Svelteコンポーネントのテスト
├── scenario/          # 実際にユーザーが使用することを想定したシナリオテスト
tests/                 # 単体テスト、結合テスト（vitest）
├── utils/             #
├── integration/       # 統合テスト
├── **/                # 単体テスト ※実際のソースコード（src/）と同じ構成でテストする
└── vitest.setup.ts    # Vitest専用設定
```

## vitestのテストの書き方

```typescript
// 基本テスト
import { test, expect } from "vitest";

test("example test", () => {
  expect(1 + 1).toBe(2);
});

// モックを使用
import { test, expect, vi } from "vitest";

test("mock test", () => {
  const mockFn = vi.fn();
  mockFn("test");
  expect(mockFn).toHaveBeenCalledWith("test");
});

// Svelteコンポーネントテスト
import { test, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import MyComponent from "../src/lib/components/MyComponent.svelte";

test("component test", async () => {
  const mockCallback = vi.fn();
  const { getByRole } = render(MyComponent, {
    props: { onClick: mockCallback }
  });

  await fireEvent.click(getByRole("button"));
  expect(mockCallback).toHaveBeenCalledTimes(1);
});
```

## Svelte 5 コンポーネントテスト

✅ **完全対応**: Svelte 5のrune（`$state`, `$props`）を含むコンポーネントテストが正常動作

### テスト対応状況
1. **ユーティリティ関数のテスト** ✅
2. **ビジネスロジックのテスト** ✅
3. **統合テスト** ✅
4. **Svelteコンポーネントテスト** ✅

## テスト戦略

1. **単体テスト**: ユーティリティ関数、ビジネスロジック
2. **統合テスト**: データフロー、サービス間連携
3. **E2Eテスト**: 将来的にPlaywrightなどで追加予定
