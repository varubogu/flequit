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
import { test, expect } from 'vitest';

test('example test', () => {
  expect(1 + 1).toBe(2);
});

// モックを使用
import { test, expect, vi } from 'vitest';

test('mock test', () => {
  const mockFn = vi.fn();
  mockFn('test');
  expect(mockFn).toHaveBeenCalledWith('test');
});

// Svelteコンポーネントテスト
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

## Svelte 5 コンポーネントテスト

✅ **完全対応**: Svelte 5のrune（`$state`, `$props`）を含むコンポーネントテストが正常動作

### テスト対応状況

1. **ユーティリティ関数のテスト** ✅
2. **ビジネスロジックのテスト** ✅
3. **統合テスト** ✅
4. **Svelteコンポーネントテスト** ✅

## 翻訳システムのテスト

### テスト時の翻訳システムモック化

Vitestでの単体テストでは以下のパターンを使用する：

#### 正しいアプローチ

`beforeEach`で`setTranslationService()`を使用してモック化する：

```typescript
import { test, expect, beforeEach } from 'vitest';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService, unitTestTranslations } from '../unit-translation-mock';

beforeEach(() => {
  setTranslationService(createUnitTestTranslationService());
});

test('翻訳が必要な関数のテスト', () => {
  expect(getStatusLabel('not_started')).toBe(unitTestTranslations.status_not_started);
});
```

#### 重要なポイント

1. **`createUnitTestTranslationService()`を使用**: `tests/unit-translation-mock.ts`から提供される専用サービス
2. **プロパティ参照で比較**: `unitTestTranslations.some_key`を使用（文字列リテラルではなく）
3. **`afterEach`での復元は不要**: Vitestは各ファイルが独立実行される
4. **グローバルモックは避ける**: `vitest.setup.ts`での翻訳関連モックは行わない

#### 避けるべきアプローチ

- `$paraglide/runtime`の直接モック
- `$lib/stores/locale.svelte`の全体モック
- `vitest.setup.ts`での翻訳関連グローバルモック

これらは翻訳システムの内部実装に依存し、テストが脆弱になる原因となる。

#### unitTestTranslationsの特徴

- 全ての翻訳キーに対して一意のテスト値を提供
- 本来の翻訳とは異なり、キーが違えば必ず異なる値になる
- テストでの区別が容易で、間違ったキーの使用を検出可能

## テスト戦略

1. **単体テスト**: ユーティリティ関数、ビジネスロジック
2. **統合テスト**: データフロー、サービス間連携
3. **E2Eテスト**: 将来的にPlaywrightなどで追加予定
