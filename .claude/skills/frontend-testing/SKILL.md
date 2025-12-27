---
name: frontend-testing
description: フロントエンド（TypeScript/Svelte 5/Vitest）のテスト実装とデバッグを行います。テストの作成、テストの実行、テストエラーの修正、Svelte 5 コンポーネントのテスト、国際化対応のモックなどのテスト関連タスクに使用します。
allowed-tools: Read, Edit, Write, Bash(bun run test:*), Bash(bun check:*)
model: sonnet
---

# Frontend Testing Skill

Flequit プロジェクトのフロントエンドテスト（TypeScript/Vitest/Svelte 5）を実装・実行するスキルです。

## テスト実行コマンド

### 単一ファイルテスト（推奨）
```bash
# まず単一ファイルでテストして正確性を確認
bun run test [filename]
```

### 全テスト実行
```bash
# 単一ファイルテストが成功してから実行
bun run test
```

### 型チェック
```bash
# bun check を使用（bun run check や bun run typecheck は使用禁止）
bun check
```

### ウォッチモード
```bash
bun run test:watch
```

## Svelte 5 テスト対応

✅ **完全サポート**: Svelte 5 の runes (`$state`, `$props`, `$derived`, `$effect`) を含むコンポーネントテストが正常に動作します。

### コンポーネントテストの書き方

```typescript
import { test, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import MyComponent from '$lib/components/MyComponent.svelte';

test('Svelte 5 component test', async () => {
  const { getByRole, getByText } = render(MyComponent, {
    props: {
      initialValue: 10
    }
  });

  const button = getByRole('button');
  await fireEvent.click(button);

  expect(getByText('11')).toBeInTheDocument();
});
```

## 国際化（i18n）テストのモック

### 正しいアプローチ

`beforeEach` で `setTranslationService()` を使用してモックを設定：

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

### 重要なポイント

1. **`createUnitTestTranslationService()` を使用**: `tests/unit-translation-mock.ts` から提供される専用サービス
2. **プロパティ参照で比較**: `unitTestTranslations.some_key` を使用（文字列リテラルではなく）
3. **`afterEach` での復元不要**: Vitest は各ファイルを独立して実行
4. **グローバルモック禁止**: `vitest.setup.ts` で翻訳関連をモックしない

### 避けるべきアプローチ

- `$paraglide/runtime` の直接モック
- `$lib/stores/locale.svelte` の完全モック
- `vitest.setup.ts` での翻訳関連グローバルモック

これらは翻訳システムの内部実装に依存し、テストを脆弱にします。

## テスト構造

### ディレクトリ構造
```
tests/                 # Unit & Integration tests
├── utils/             # ユーティリティ関数テスト
├── integration/       # インテグレーションテスト
├── **/                # ユニットテスト（src/ と同じ構造）
└── vitest.setup.ts    # Vitest設定

e2e/                   # E2E tests (Playwright)
├── components/        # コンポーネントテスト
└── scenario/          # シナリオテスト
```

## テスト戦略

### 1. ユニットテスト
ユーティリティ関数やビジネスロジックのテスト

```typescript
describe('calculateProgress', () => {
  it('タスクが0個の場合は0を返す', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('正しいパーセンテージを計算', () => {
    expect(calculateProgress(3, 10)).toBe(30);
  });
});
```

### 2. インテグレーションテスト
データフロー、サービス連携のテスト

```typescript
test('タスク作成フロー', async () => {
  const taskService = new TaskService();
  const task = await taskService.createTask({
    title: 'テストタスク',
    projectId: 'project-1'
  });

  expect(task.id).toBeDefined();
  expect(task.title).toBe('テストタスク');
});
```

### 3. コンポーネントテスト
Svelte コンポーネントのテスト

```typescript
test('タスクアイテムコンポーネント', async () => {
  const mockOnComplete = vi.fn();
  const { getByRole } = render(TaskItem, {
    props: {
      task: { id: '1', title: 'Test', status: 'todo' },
      onComplete: mockOnComplete
    }
  });

  await fireEvent.click(getByRole('button', { name: '完了' }));
  expect(mockOnComplete).toHaveBeenCalledWith('1');
});
```

## エラーハンドリング

### テスト失敗時の対応

1. **エラーメッセージを確認**: どのアサーションが失敗したか
2. **型エラーの場合**: `bun check` で型チェック
3. **実装を確認**: テスト対象のコードを読む
4. **段階的にデバッグ**: `console.log` で中間値を確認

### よくあるエラーと解決方法

#### 1. `TypeError: Cannot read properties of undefined`
- 原因: モックが正しく設定されていない
- 解決: モックの戻り値を確認、必要なプロパティを追加

#### 2. `ReferenceError: document is not defined`
- 原因: DOM 環境が必要
- 解決: `@testing-library/svelte` を使用

#### 3. 翻訳関連エラー
- 原因: 翻訳モックが設定されていない
- 解決: `beforeEach` で `setTranslationService()` を呼び出し

## ベストプラクティス

### 1. AAA パターン（Arrange-Act-Assert）

```typescript
test('example', () => {
  // Arrange - テストデータとモックを準備
  const data = { value: 10 };
  const mockFn = vi.fn();

  // Act - 対象の関数/メソッドを実行
  const result = processData(data, mockFn);

  // Assert - 結果を検証
  expect(result).toBe(20);
  expect(mockFn).toHaveBeenCalledWith(data);
});
```

### 2. テストの独立性

各テストは他のテストに依存しないこと：

```typescript
// Good
describe('TaskStore', () => {
  let store: TaskStore;

  beforeEach(() => {
    store = new TaskStore(); // 各テストで新しいインスタンス
  });

  test('test 1', () => { /* ... */ });
  test('test 2', () => { /* ... */ });
});

// Bad - テスト間で状態が共有される
const store = new TaskStore();
test('test 1', () => { store.addTask(...); });
test('test 2', () => { /* store の状態が test 1 の影響を受ける */ });
```

### 3. 意味のあるテスト名

```typescript
// Good - 何をテストしているか明確
test('空のタイトルでタスクを作成できない', () => { /* ... */ });

// Bad - 何をテストしているか不明確
test('validation', () => { /* ... */ });
```

## 関連ドキュメント

詳細は以下のドキュメントを参照：
- `docs/en/develop/design/testing.md` - テスト戦略全体
- `docs/en/develop/rules/testing.md` - テストルール
- `docs/en/develop/design/frontend/svelte5-patterns.md` - Svelte 5 パターン
