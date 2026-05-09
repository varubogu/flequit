# コーディング規約 (言語横断)

Flequit プロジェクトで統一されたコードスタイルと品質を保つための規約。フロントエンド (TypeScript/Svelte) とバックエンド (Rust) で共通する事項に絞る。各言語の詳細は別ドキュメントを参照。

| 領域 | 詳細ドキュメント |
| --- | --- |
| Svelte 5 / コンポーネント設計 | `docs/ja/develop/design/frontend/svelte5-patterns.md`, `docs/ja/develop/rules/frontend.md` |
| レイヤー / ストア・サービス | `docs/ja/develop/design/frontend/layers.md`, `store-and-service-architecture.md` |
| Rust 設計 / クレート構成 | `docs/ja/develop/design/backend-tauri/rust-guidelines.md`, `docs/ja/develop/rules/backend.md` |
| Tauri ↔ フロントエンド IPC | `.claude/skills/tauri-command/SKILL.md` |
| テスト | `docs/ja/develop/rules/testing.md` |
| i18n | `docs/ja/develop/design/frontend/i18n-system.md` |
| ドキュメント | `docs/ja/develop/rules/documentation.md` |

---

## ファイル構成

### 単一責任原則

- 1 ファイル 1 機能
- ファイル名から機能が推測できる命名
- **Store と UI サービスの分離**: ストア (`src/lib/stores/...`) は状態キャッシュと同期のみ。副作用・インフラ呼び出し・複数ストアの調停は UI サービス (`src/lib/services/ui/...`) で実装

### ファイルサイズ

- **200 行超過**: 必須分割 (テスト除く)
- **100 行超過**: 分割を検討
- **例外**: 設定ファイル・データ定義
- 分割方針は `docs/ja/develop/design/frontend/svelte5-patterns.md` の「コンポーネント分割指針」を参照

---

## 命名規則

### ファイル・ディレクトリ

- ケバブケース基本: `task-item.svelte`, `user-service.ts`, `task-management/`
- 例外: テーブル名等、フレームワーク慣例に従う場合
- shadcn-svelte の `src/lib/components/ui/` はオリジナルを維持

### 変数・関数・型

| 言語 | 変数・関数 | 型・クラス・enum | 定数 |
| --- | --- | --- | --- |
| TypeScript / JavaScript | `camelCase` | `PascalCase` | `SCREAMING_SNAKE_CASE` |
| Rust | `snake_case` | `PascalCase` | `SCREAMING_SNAKE_CASE` |

```typescript
const userName = 'john';
const USER_ROLE_ADMIN = 'admin';
function getUserById(id: string) {}
class TaskManager {}
```

```rust
let user_name = "john";
const USER_ROLE_ADMIN: &str = "admin";
fn get_user_by_id(id: &str) {}
struct TaskManager {}
```

---

## 型定義 (TypeScript)

### 厳密な型指定

- `any` の使用は禁止 (例外: 明確な理由をコメントで記載)
- ユニオン型でドメイン値を制約: `'todo' | 'in_progress' | 'completed'`
- Optional vs Required を明示的に区別

```typescript
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignee?: User;
}
```

### `Optional` の解釈

- `?` (オプション): 値が存在しない可能性
- `| null` / `| undefined`: 値はあるが空状態

---

## エラーハンドリング

### TypeScript: 明示的な分岐

```typescript
async function fetchTasks(): Promise<Task[] | null> {
  try {
    const response = await api.getTasks();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return null;
  }
}
```

### Rust: `Result<T, E>` + `thiserror`

階層化されたエラー型を使用。詳細は `docs/ja/develop/design/backend-tauri/rust-guidelines.md` の「エラーハンドリング」を参照。

```rust
pub async fn update_task_status(id: &TaskId, new_status: TaskStatus) -> TaskResult<Task> {
    let mut task = repository.find_by_id(id).await?
        .ok_or_else(|| TaskError::NotFound { id: *id })?;
    if !task.status.can_transition_to(new_status) {
        return Err(TaskError::InvalidStatusTransition { from: task.status, to: new_status });
    }
    task.status = new_status;
    repository.save(&task).await?;
    Ok(task)
}
```

---

## Tauri ↔ フロントエンド通信 (要約)

詳細は `.claude/skills/tauri-command/SKILL.md` を参照。

- **JS 側**: `camelCase` (Tauri が自動的に Rust の `snake_case` にマップする)
- **Rust 側**: `snake_case` パラメータ
- **戻り値**: 成功/失敗のみ → `Result<bool, String>` (Rust) / `Promise<boolean>` (TS)。データ取得は `Result<Option<T>, String>` / `Result<Vec<T>, String>`
- **invoke import**: `@tauri-apps/api/core` (古い `@tauri-apps/api/tauri` は使用しない)
- **共通エラーラッパ**: TS 側で `tauriServiceMethod<T>` ヘルパを 1 箇所に定義し、`console.error` でログ + `null` / `false` 返却

実装参照:
- TS ヘルパ: `src/lib/services/domain/...-backend.ts`
- Rust handler: `src-tauri/src/commands/...`

---

## Import 順序 (TypeScript)

1. Node modules (`@tauri-apps/...`, `svelte/...`)
2. 内部ライブラリ (`$lib/types`, `$lib/services/...`, `$lib/components/...`)
3. 相対パス (エイリアスが利用できない場合のみ)

### Svelte コンポーネント import

- `src/lib/components` 配下のエイリアス (`$lib/components/...`) を必ず使用
- エイリアス未定義のフォルダ (`src/routes/...` のローカル補助等) のみ相対パスを許可
- ESLint ルール無効化が必要な場合は理由をコメントで明記

### Export 規約

- **Named export を優先** (`export { TaskManager }`, `export type { Task, TaskStatus }`)
- `default export` は単一の主要エクスポートのみ

---

## 関数・メソッド設計

### 純粋関数を推奨

- 計算と副作用を分離
- 関数名から副作用が推測できない場合はリファクタ対象

```typescript
function calculateProgress(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
```

### Svelte 5 状態管理

- 派生状態は必ず `$derived` を使用 (手動 `$effect` での同期は禁止)

```typescript
const isFormValid = $derived(formData.title.trim().length > 0);
```

詳細は `docs/ja/develop/design/frontend/svelte5-patterns.md` 参照。

---

## ドキュメンテーションコメント

- 公開 API には JSDoc / rustdoc を付与
- `# Examples` / `@example` を含めるとレビュー効率が高い
- 実装の意図ではなく「使い方」と「契約」を記述する

---

## パフォーマンスの基本

### フロントエンド

- 派生状態 (`$derived`) を使用し、手動同期を避ける
- リスト描画では `key` 指定を活用

### バックエンド

- N+1 を避ける: バッチ取得 / `JOIN` で 1 クエリ化
- 並列 I/O は `tokio::join!` を活用
- 詳細は `rust-guidelines.md` の「パフォーマンス最適化」を参照
