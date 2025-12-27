---
name: debugging
description: フロントエンドとバックエンドのデバッグを支援します。エラーの原因特定、ログの確認、型エラーの修正、実行時エラーの解析、Tauri 通信のデバッグなどに使用します。
allowed-tools: Read, Edit, Bash(bun check:*), Bash(cargo check:*), Bash(bun run lint:*)
model: sonnet
---

# Debugging Skill

Flequit プロジェクトのデバッグを支援するスキルです。

## デバッグ戦略

### 1. エラー情報の収集
### 2. 原因の特定
### 3. 修正の実施
### 4. 検証

## フロントエンドデバッグ

### 型エラー

#### 確認方法

```bash
# 型チェック（必ずこれを使用）
bun check

# Lintチェック
bun run lint
```

#### よくある型エラー

**1. `Type 'X' is not assignable to type 'Y'`**

```typescript
// ❌ NG: 型が一致しない
const status: TaskStatus = 'invalid'; // Error!

// ✅ OK: 正しい型を使用
const status: TaskStatus = 'todo'; // OK

// ✅ OK: Union type を使用
type TaskStatus = 'todo' | 'in_progress' | 'completed';
```

**2. `Property 'X' does not exist on type 'Y'`**

```typescript
// ❌ NG: プロパティが存在しない
interface Task {
  id: string;
  title: string;
}
const task: Task = { id: '1', title: 'Test', status: 'todo' }; // Error!

// ✅ OK: 型定義を修正
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}
```

**3. `Object is possibly 'undefined'`**

```typescript
// ❌ NG: undefined チェックなし
function getTaskTitle(task: Task | undefined): string {
  return task.title; // Error: Object is possibly 'undefined'
}

// ✅ OK: Optional chaining を使用
function getTaskTitle(task: Task | undefined): string | undefined {
  return task?.title;
}

// ✅ OK: Guard clause を使用
function getTaskTitle(task: Task | undefined): string {
  if (!task) return '';
  return task.title;
}
```

### 実行時エラー

#### ブラウザ開発者ツールの使用

1. **Console タブ**: エラーメッセージを確認
2. **Network タブ**: API 通信を確認
3. **Sources タブ**: ブレークポイントを設定

#### よくある実行時エラー

**1. `Cannot read properties of undefined`**

```typescript
// 原因: オブジェクトが undefined
const title = task.title; // task が undefined

// 解決: Optional chaining
const title = task?.title ?? 'Untitled';
```

**2. `invoke failed: ...`**

```typescript
// 原因: Tauri コマンド呼び出しエラー
try {
  const result = await invoke('get_tasks', { projectId });
} catch (error) {
  console.error('Invoke failed:', error);
  // エラー内容を確認して原因を特定
}
```

**3. Svelte 5 Reactivity エラー**

```typescript
// ❌ NG: $state の不適切な使用
let count = 0; // Reactive ではない
count++; // UI は更新されない

// ✅ OK: $state を使用
let count = $state(0);
count++; // UI が更新される

// ❌ NG: $derived の循環参照
const a = $derived(b + 1);
const b = $derived(a + 1); // Error: Circular dependency

// ✅ OK: 適切な依存関係
const a = $state(1);
const b = $derived(a + 1);
```

### Tauri 通信のデバッグ

#### フロントエンド側

```typescript
// デバッグ用のラッパー関数
async function debugInvoke<T>(
  command: string,
  params?: object
): Promise<T | null> {
  console.log(`[Invoke] ${command}`, params);

  try {
    const result = await invoke<T>(command, params);
    console.log(`[Invoke Success] ${command}`, result);
    return result;
  } catch (error) {
    console.error(`[Invoke Error] ${command}`, error);
    return null;
  }
}

// 使用例
const tasks = await debugInvoke<Task[]>('get_tasks', { projectId: 'test' });
```

#### パラメータ名のデバッグ

```typescript
// JavaScript: camelCase
await invoke('update_task', {
  projectId: 'project-123',  // Rust: project_id
  taskId: 'task-456',        // Rust: task_id
});

// Rust 側で受け取れない場合は、名前の対応を確認
```

## バックエンドデバッグ

### コンパイルエラー

#### 確認方法

```bash
# 型チェック
cargo check

# 全 crate チェック
cargo check --workspace

# 特定の crate のみ
cargo check -p flequit-storage
```

#### よくあるコンパイルエラー

**1. `cannot borrow as mutable`**

```rust
// ❌ NG: 不変借用中に可変借用
let tasks = repository.get_all();
repository.save(&task); // Error!

// ✅ OK: 借用を分離
let tasks = repository.get_all();
drop(tasks); // 明示的に解放
repository.save(&task);

// ✅ OK: スコープを分ける
{
    let tasks = repository.get_all();
    // tasks を使用
} // tasks がドロップされる
repository.save(&task);
```

**2. `trait bound is not satisfied`**

```rust
// ❌ NG: 必要な trait が実装されていない
#[derive(Debug)]
struct Task {
    id: String,
}

fn print_task(task: Task) {
    println!("{}", task); // Error: Task doesn't implement Display
}

// ✅ OK: 必要な trait を実装
#[derive(Debug)]
struct Task {
    id: String,
}

impl std::fmt::Display for Task {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Task({})", self.id)
    }
}
```

**3. `async fn in trait`**

```rust
// ❌ NG: async trait が不足
trait TaskRepository {
    async fn get_all(&self) -> Result<Vec<Task>>; // Error!
}

// ✅ OK: #[async_trait] を使用
use async_trait::async_trait;

#[async_trait]
trait TaskRepository {
    async fn get_all(&self) -> Result<Vec<Task>>;
}
```

### 実行時エラー

#### ログの確認

```rust
// ログレベル
log::error!("Critical error: {}", error);  // エラー
log::warn!("Warning: {}", warning);        // 警告
log::info!("Information: {}", info);       // 情報
log::debug!("Debug info: {}", debug);      // デバッグ
log::trace!("Trace: {}", trace);           // トレース

// 使用例
pub async fn get_task(id: &TaskId) -> Result<Task, ServiceError> {
    log::debug!("Getting task: {}", id);

    let task = repository.find_by_id(id).await?;

    if let Some(task) = task {
        log::info!("Task found: {}", task.id);
        Ok(task)
    } else {
        log::warn!("Task not found: {}", id);
        Err(ServiceError::NotFound(format!("Task {} not found", id)))
    }
}
```

#### よくある実行時エラー

**1. `database is locked`**

```rust
// 原因: SQLite のトランザクションが競合
// 解決: トランザクションを適切に管理

// ✅ OK: トランザクションを明示的に終了
let txn = db.begin().await?;
// ... operations ...
txn.commit().await?; // 明示的にコミット
```

**2. `connection closed`**

```rust
// 原因: データベース接続が閉じられた
// 解決: 接続プールを使用

// ✅ OK: 接続プールから取得
let pool = SqlitePool::connect(&database_url).await?;
let conn = pool.acquire().await?;
```

**3. Option/Result エラー**

```rust
// ❌ NG: unwrap でパニック
let task = repository.find_by_id(id).await.unwrap(); // パニックの可能性

// ✅ OK: ? 演算子でエラー伝播
let task = repository.find_by_id(id).await?
    .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;

// ✅ OK: match で処理
let task = match repository.find_by_id(id).await? {
    Some(task) => task,
    None => return Err(ServiceError::NotFound("Task not found".to_string())),
};
```

### トランザクションのデバッグ

```rust
// デバッグ用のログを追加
pub async fn delete_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<bool, String> {
    log::debug!("Starting transaction for delete_task");

    let txn = repositories.begin().await
        .map_err(|e| {
            log::error!("Failed to begin transaction: {:?}", e);
            format!("Transaction error: {:?}", e)
        })?;

    log::debug!("Transaction started successfully");

    // ... operations ...

    repositories.commit(txn).await
        .map_err(|e| {
            log::error!("Failed to commit transaction: {:?}", e);
            format!("Commit error: {:?}", e)
        })?;

    log::debug!("Transaction committed successfully");

    Ok(true)
}
```

## デバッグツール

### フロントエンド

#### 1. Svelte DevTools

ブラウザ拡張機能を使用してコンポーネントの状態を確認

#### 2. Console API

```typescript
// グループ化
console.group('Task Operations');
console.log('Creating task...');
console.log('Task created:', task);
console.groupEnd();

// テーブル表示
console.table(tasks);

// タイマー
console.time('load-tasks');
await loadTasks();
console.timeEnd('load-tasks');

// スタックトレース
console.trace('How did we get here?');
```

### バックエンド

#### 1. デバッグビルド

```bash
# デバッグモードでビルド（最適化なし）
cargo build

# リリースモード（最適化あり）
cargo build --release
```

#### 2. テストでのデバッグ

```rust
#[tokio::test]
async fn test_with_debug() {
    env_logger::init(); // ログ出力を有効化

    let result = complex_function().await;

    println!("Result: {:?}", result); // デバッグ出力

    assert!(result.is_ok());
}
```

## トラブルシューティングチェックリスト

### フロントエンド

- [ ] `bun check` で型エラーがないか確認
- [ ] `bun run lint` で lint エラーがないか確認
- [ ] ブラウザの Console でエラーを確認
- [ ] Network タブで API 通信を確認
- [ ] Tauri invoke のパラメータ名が正しいか確認（camelCase）
- [ ] $state, $derived の使用が適切か確認

### バックエンド

- [ ] `cargo check` でコンパイルエラーがないか確認
- [ ] ログ出力でエラー箇所を特定
- [ ] トランザクションが適切に管理されているか確認
- [ ] Option/Result の処理が適切か確認
- [ ] async_trait が正しく使用されているか確認
- [ ] Tauri command のパラメータ名が正しいか確認（snake_case）

### 共通

- [ ] テストが通るか確認
- [ ] エラーメッセージを詳しく読む
- [ ] スタックトレースで原因箇所を特定
- [ ] 段階的にコードを追加して問題を絞り込む
- [ ] 最小再現コードを作成

## 関連ドキュメント

詳細は以下のドキュメントを参照：
- `docs/en/develop/design/error-handling.md` - エラーハンドリング
- `docs/en/develop/rules/coding-standards.md` - コーディング標準
- `docs/en/develop/design/testing.md` - テスト戦略
