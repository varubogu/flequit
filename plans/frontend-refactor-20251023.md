# フロントエンドリファクタリング計画書

**作成日**: 2025-10-23
**対象**: Flequit フロントエンドコードベース
**目的**: コードの保守性向上、コーディング規約遵守、アーキテクチャの改善

---

## 1. エグゼクティブサマリー

本計画書は、Flequitプロジェクトのフロントエンドコードベースに対する包括的なリファクタリング計画を示します。現状分析により、以下の主要な問題が特定されました：

- **ファイルサイズ違反**: 5ファイルがコーディング規約（200行以下推奨）を超過
- **状態管理の複雑性**: ストア間の責務が重複し、依存関係が複雑
- **コンポーネント設計**: ビジネスロジックとUI表示の分離が不十分
- **依存関係の問題**: 61個のコンポーネントが直接ストアを参照

これらの問題を段階的に解決することで、コードベースの保守性、テスタビリティ、拡張性を向上させます。

---

## 2. 現状分析

### 2.1 ファイルサイズ違反

**コーディング規約**: ファイルは200行以下推奨、100行超えで分割検討

| ファイル | 行数 | 違反度 | 場所 |
|---------|------|--------|------|
| task-mutations.ts | 334行 | 🔴 高 | src/lib/services/domain/task/ |
| date-format-editor.svelte | 298行 | 🔴 高 | src/lib/components/settings/date-format/ |
| task-list-store.svelte.ts | 297行 | 🔴 高 | src/lib/stores/ |
| task-core-store.svelte.ts | 297行 | 🔴 高 | src/lib/stores/ |
| tasks.svelte.ts | 264行 | 🟡 中 | src/lib/stores/ |
| datetime-format.svelte.ts | 264行 | 🟡 中 | src/lib/stores/ |
| sub-task-store.svelte.ts | 247行 | 🟡 中 | src/lib/stores/ |
| tags.svelte.ts | 245行 | 🟡 中 | src/lib/stores/ |
| task-item.svelte | 238行 | 🟡 中 | src/lib/components/task/core/ |

### 2.2 アーキテクチャの問題

#### 2.2.1 ストア層の責務重複

```
TaskStore (264行)
├─ TaskEntitiesStore (153行) - エンティティ管理
├─ TaskSelectionStore - 選択状態管理
└─ TaskDraftStore - 新規タスク下書き管理

TaskCoreStore (297行) - CRUD操作
TaskListStore (297行) - タスクリスト管理
```

**問題点**:
- TaskStoreがラッパーとして複雑化
- TaskCoreStoreとTaskStoreの責務が重複
- Proxy遅延初期化が複数箇所で使用され、複雑度増加

#### 2.2.2 サービス層の複雑性

**TaskMutations (334行)**:
- タスクステータス変更
- タスク更新
- タスク削除
- タスク追加
- タグ管理
- タスク移動
- 繰り返しタスク処理

→ 単一責任原則違反、複数の責務を持つ

### 2.3 依存関係の問題

```
┌─────────────────┐
│   Component     │
│  (61個が直接)  │──┐
└─────────────────┘  │
                     ├──► TranslationService
┌─────────────────┐  │
│   Component     │  │
└─────────────────┘──┘
         │
         ├──► TaskStore
         ├──► ProjectStore
         ├──► TagStore
         └──► SelectionStore
```

**問題点**:
- コンポーネントが複数のストアを直接import
- テスト時のモック化が困難
- 依存関係の変更時の影響範囲が大きい

### 2.4 コンポーネント設計の問題

1. **大きなコンポーネント**
   - date-format-editor.svelte (298行)
   - task-item.svelte (238行)

2. **ビジネスロジックの混在**
   - 25箇所の非同期処理がコンポーネント内
   - エラーハンドリングがコンポーネント内
   - 状態変更ロジックがコンポーネント内

3. **UI層の責務不明確**
   - プレゼンテーション層とコンテナ層の分離不十分

---

## 3. リファクタリング優先順位

### 🔴 高優先度（Phase 1: 1-2週間）

即座に対応すべき、コーディング規約違反や重大な設計問題

1. **task-mutations.tsの分割** (334行 → 複数ファイル)
2. **TaskStore層の再設計**
3. **date-format-editor.svelteの分割** (298行 → サブコンポーネント化)

### 🟡 中優先度（Phase 2: 2-4週間）

保守性向上のために近いうちに対応すべき項目

4. **task-item.svelteのロジック分離**
5. **ストアの責務整理**（TaskCoreStore, TaskListStore）
6. **サービス層の依存注入パターン統一**
7. **翻訳サービスの注入方法統一**

### 🟢 低優先度（Phase 3: 将来的に検討）

長期的な改善項目

8. **型定義の集約**
9. **テストカバレッジの向上**

---

## 4. 具体的なリファクタリング項目

### Phase 1: 高優先度（1-2週間）

#### 4.1 task-mutations.tsの分割 (334行)

**現状**: 1ファイルに複数の責務が混在

**リファクタリング後**:
```
src/lib/services/domain/task/
├─ mutations/
│  ├─ task-status-mutations.ts    (ステータス変更)
│  ├─ task-crud-mutations.ts      (CRUD操作)
│  ├─ task-tag-mutations.ts       (タグ管理)
│  ├─ task-move-mutations.ts      (移動操作)
│  └─ index.ts                    (統合エクスポート)
└─ task-mutations.ts              (Facade、互換性維持)
```

**期待効果**:
- 単一責任原則の遵守
- テストの容易性向上
- 保守性の向上

**影響範囲**:
- TaskMutationsを使用している箇所（主にコンポーネント）
- 既存のインポートは互換性維持のためFacadeで対応

#### 4.2 TaskStore層の再設計

**現状の問題**:
```typescript
// 複雑な3層構造
TaskStore
├─ TaskEntitiesStore
├─ TaskSelectionStore
└─ TaskDraftStore
```

**提案: Option A - Composable化（推奨）**
```typescript
// stores/tasks/composables/
export function useTaskEntities() { ... }
export function useTaskSelection() { ... }
export function useTaskDraft() { ... }

// TaskStoreは薄いFacadeに
export class TaskStore {
  entities = useTaskEntities();
  selection = useTaskSelection();
  draft = useTaskDraft();
}
```

**提案: Option B - 完全分離**
```typescript
// 各ストアを独立させる
export const taskEntitiesStore = ...
export const taskSelectionStore = ...
export const taskDraftStore = ...
```

**推奨**: Option A
- Svelte 5のrunesパターンに適合
- 既存コードの変更が最小限
- テスタビリティ向上

#### 4.3 date-format-editor.svelteの分割 (298行)

**現状**: 1コンポーネントに多数のロジックと子コンポーネント

**リファクタリング後**:
```
components/settings/date-format/
├─ date-format-editor.svelte          (親コンポーネント、60-80行)
├─ date-format-editor-controller.svelte.ts  (ロジック分離)
├─ sections/
│  ├─ test-section.svelte
│  ├─ main-section.svelte
│  └─ custom-section.svelte
└─ hooks/
   ├─ use-format-validation.svelte.ts
   └─ use-format-management.svelte.ts
```

**ステップ**:
1. ロジック層をcontrollerに抽出
2. バリデーション、管理機能をhooksに分離
3. UI表示をsectionsに分割
4. 親コンポーネントは構成のみ

---

### Phase 2: 中優先度（2-4週間）

#### 4.4 task-item.svelteのロジック分離 (238行)

**現状**: ロジックとUIの分離は進んでいるが、まだ大きい

**改善案**:
```
components/task/core/
├─ task-item.svelte               (親、50行程度)
├─ task-item-controller.svelte.ts (既存)
├─ task-item-content.svelte       (既存)
├─ parts/
│  ├─ task-item-header.svelte
│  ├─ task-item-body.svelte
│  └─ task-item-subtasks.svelte
└─ hooks/
   ├─ use-task-drag-drop.svelte.ts
   └─ use-task-context-menu.svelte.ts
```

#### 4.5 ストアの責務整理

**TaskCoreStore (297行) の分割**:
```
stores/task-core/
├─ task-core-queries.svelte.ts    (読み取り操作)
├─ task-core-mutations.svelte.ts  (変更操作)
└─ task-core-store.svelte.ts      (統合、100行以下)
```

**TaskListStore (297行) の分割**:
```
stores/task-list/
├─ task-list-queries.svelte.ts    (読み取り操作)
├─ task-list-mutations.svelte.ts  (変更操作)
├─ task-list-ordering.svelte.ts   (並び替え専用)
└─ task-list-store.svelte.ts      (統合、100行以下)
```

#### 4.6 サービス層の依存注入パターン統一

**現状**: 一部のサービスのみ依存注入を使用

**改善案**:
```typescript
// 統一的な依存注入パターン
export class TaskService {
  constructor(
    private deps: {
      taskStore: TaskStoreLike;
      errorHandler: ErrorHandlerLike;
      backend: TaskBackendLike;
    }
  ) {}
}

// デフォルト実装の提供
export function createTaskService(
  overrides?: Partial<TaskServiceDeps>
): TaskService {
  return new TaskService({
    taskStore: overrides?.taskStore ?? taskStore,
    errorHandler: overrides?.errorHandler ?? errorHandler,
    backend: overrides?.backend ?? getBackend().task,
  });
}
```

**対象サービス**:
- TaskMutations（既に実装済み）
- SubTaskMutations（既に実装済み）
- ProjectService（未実装）
- TagService（未実装）

#### 4.7 翻訳サービスの注入方法統一

**現状**: 61個のコンポーネントが直接`getTranslationService()`を呼び出し

**改善案 Option A: Context API**
```typescript
// lib/context/translation-context.svelte.ts
export const translationContext = createContext<TranslationService>();

// 親コンポーネント
<script>
  setContext(translationContext, getTranslationService());
</script>

// 子コンポーネント
<script>
  const t = getContext(translationContext);
</script>
```

**改善案 Option B: Composable**
```typescript
// lib/hooks/use-translation.svelte.ts
export function useTranslation() {
  return getTranslationService();
}

// コンポーネント
<script>
  const t = useTranslation();
</script>
```

**推奨**: Option B
- Svelte 5のrunesパターンに適合
- シンプルで理解しやすい
- テスト時のモック化が容易

---

### Phase 3: 低優先度（将来的に検討）

#### 4.8 型定義の集約

**現状**: 17個の型定義ファイルが分散

**改善案**:
```
types/
├─ domain/                        (ドメインモデル)
│  ├─ task.ts
│  ├─ project.ts
│  └─ tag.ts
├─ ui/                           (UI関連の型)
│  ├─ context-menu.ts
│  └─ store-interfaces.ts
└─ infrastructure/               (Infrastructure層の型)
   └─ bindings.ts
```

#### 4.9 テストカバレッジの向上

**現状**: テストファイルの配置は良好だが、カバレッジの確認が必要

**推奨アクション**:
1. カバレッジレポートの生成設定
2. 重要なビジネスロジックのテスト追加
3. リファクタリング後の回帰テスト

---

## 5. 実施計画

### Phase 1: 基盤整備（週1-2）

| 項目 | 担当 | 期間 | 優先度 |
|------|------|------|--------|
| task-mutations.tsの分割 | Dev | 3日 | 🔴 高 |
| date-format-editor.svelteの分割 | Dev | 3日 | 🔴 高 |
| TaskStore層の再設計（設計） | Dev | 2日 | 🔴 高 |

**マイルストーン**:
- コーディング規約違反の解消
- ビルドとテストが全て通過
- 既存機能の動作確認

### Phase 2: アーキテクチャ改善（週3-6）

| 項目 | 担当 | 期間 | 優先度 |
|------|------|------|--------|
| TaskStore層の再設計（実装） | Dev | 5日 | 🟡 中 |
| ストアの責務整理 | Dev | 5日 | 🟡 中 |
| task-item.svelteのロジック分離 | Dev | 3日 | 🟡 中 |
| サービス層の依存注入統一 | Dev | 4日 | 🟡 中 |
| 翻訳サービスの注入方法統一 | Dev | 3日 | 🟡 中 |

**マイルストーン**:
- 依存関係の単純化
- テスタビリティの向上
- パフォーマンスの維持

### Phase 3: 継続的改善（週7以降）

| 項目 | 担当 | 期間 | 優先度 |
|------|------|------|--------|
| 型定義の集約 | Dev | 2日 | 🟢 低 |
| テストカバレッジ向上 | Dev | 継続 | 🟢 低 |

---

## 6. リスクと注意点

### 6.1 技術的リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 既存機能の破壊 | 🔴 高 | ・小さな単位でリファクタリング<br>・各ステップで回帰テスト実施<br>・フィーチャーフラグの活用 |
| パフォーマンス劣化 | 🟡 中 | ・リファクタリング前後でベンチマーク<br>・大量データでの動作確認 |
| テストの不足 | 🟡 中 | ・重要な変更には必ずテスト追加<br>・E2Eテストの実施 |

### 6.2 実施上の注意点

1. **段階的な実施**
   - 一度に大きな変更を行わない
   - 各Phaseごとにレビューと動作確認

2. **後方互換性の維持**
   - 既存のインポートパスは可能な限り維持
   - Facadeパターンで互換性レイヤーを提供

3. **ドキュメントの更新**
   - リファクタリングに伴いCLAUDE.mdを更新
   - 新しいパターンをdocs/に文書化

4. **チーム内の共有**
   - リファクタリングの意図と方法を共有
   - コードレビューでの確認項目の明確化

### 6.3 成功基準

以下の条件を満たした時点で、リファクタリングを成功とみなします：

✅ **コード品質**
- すべてのファイルが200行以下
- コーディング規約に準拠
- ESLint/型チェックエラーなし

✅ **機能性**
- 既存機能が全て動作
- 回帰テストが全て通過
- パフォーマンスの劣化なし

✅ **保守性**
- 依存関係が明確
- テストが追加・修正しやすい
- 新機能の追加が容易

✅ **ドキュメント**
- リファクタリング内容が文書化
- 新しいパターンが理解可能

---

## 7. 参考資料

### 7.1 関連ドキュメント

- `docs/en/develop/rules/coding-standards.md` - コーディング規約
- `docs/en/develop/design/frontend/svelte5-patterns.md` - Svelte 5パターン
- `docs/en/develop/design/architecture.md` - 全体アーキテクチャ
- `CLAUDE.md` - プロジェクト指針

### 7.2 主要な変更対象ファイル

**Phase 1**:
- `src/lib/services/domain/task/task-mutations.ts` (334行)
- `src/lib/components/settings/date-format/date-format-editor.svelte` (298行)
- `src/lib/stores/tasks.svelte.ts` (264行)

**Phase 2**:
- `src/lib/stores/task-core-store.svelte.ts` (297行)
- `src/lib/stores/task-list-store.svelte.ts` (297行)
- `src/lib/components/task/core/task-item.svelte` (238行)

**Phase 3**:
- `src/lib/types/` (17ファイル)

---

## 8. 次のステップ

1. **計画書のレビュー** (1日)
   - チームメンバーとの議論
   - 優先順位の調整
   - スケジュールの確定

2. **Phase 1の開始** (3日目〜)
   - task-mutations.tsの分割から着手
   - 日次での進捗確認
   - 問題発生時の早期対応

3. **継続的な改善**
   - 各Phaseの完了後に振り返り
   - 新しい問題の早期発見
   - ベストプラクティスの蓄積

---

**文書履歴**:
- 2025-10-23: 初版作成
- 2025-10-23: Infrastructure層のリファクタリング項目を削除（現在の実装が適切と判断）

**承認**:
- [ ] 開発リーダー
- [ ] アーキテクト
- [ ] QAリード
