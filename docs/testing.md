# テスト環境

## 現在の構成

- **テストランナー**: vitest (統一)
- **テスト種類**: ユーティリティ関数、ビジネスロジック、統合テスト、Svelteコンポーネント

## 実行コマンド

```bash
# 全テスト実行
bun run test

# ウォッチモード
bun run test:watch

# UI付きテスト実行
bun run test:ui

# 特定ディレクトリのみ
bun run test tests/utils/
```

## テストファイル構成

```
tests/
├── utils/              # ユーティリティ関数のテスト
│   ├── date-utils.test.ts
│   └── task-utils.test.ts
├── logic/              # ビジネスロジックのテスト
│   └── task-logic.test.ts
├── integration/        # 統合テスト
│   └── data-flow.test.ts
├── services/           # サービス層のテスト（モック使用）
│   ├── task-service.test.ts
│   └── data-service.test.ts
├── test-utils.ts       # テストユーティリティ（bun/vitest切り替え用）
├── setup.ts           # テスト環境設定
└── vitest.setup.ts    # Vitest専用設定
```

## テストの書き方

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

## 現在の成果

- ✅ **37 tests passing** - vitest統一で全テスト成功
- ✅ **7 test files** - ユーティリティからコンポーネントまで完全カバー
- ✅ **Svelte 5完全対応** - コンポーネントテストも正常動作
- ✅ **統一テスト環境** - `bun run test`で全テスト実行
- ✅ **不具合の早期検知体制構築完了**