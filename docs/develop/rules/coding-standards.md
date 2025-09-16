# コーディング規約

## 概要

Flequitプロジェクトで統一されたコードスタイルと品質を保つためのコーディング規約を定めます。フロントエンド（TypeScript/Svelte）、バックエンド（Rust）共通の規約と、各技術固有の規約を含みます。

## 共通規約

### ファイル構成

#### 単一責任原則
- **1ファイル1機能**: 各ファイルは単一の責任を持つ
- **適切な分割**: 機能が複雑になった場合は適切に分割
- **明確な命名**: ファイル名から機能が推測できること

#### ファイルサイズ規約
- **200行超過**: 必須分割対象
- **100行超過**: 分割を検討
- **例外**: 設定ファイルやデータ定義は除く

### 命名規則

#### ディレクトリ・ファイル名
```
components/
├── ui/                    # shadcn-svelte基本コンポーネント
├── shared/                # 共通コンポーネント
├── task-management/       # 機能別ディレクトリ（ケバブケース）
└── project-settings/

task-item.svelte          # Svelteコンポーネント（ケバブケース）
user-service.ts           # サービスクラス（ケバブケース）
types.ts                  # 型定義ファイル
```

#### 変数・関数名
```typescript
// TypeScript/JavaScript
const userName = 'john';              // camelCase
const USER_ROLE_ADMIN = 'admin';      // 定数はSCREAM_SNAKE_CASE
function getUserById(id: string) {}   // camelCase
class TaskManager {}                  // PascalCase

// Rust
let user_name = "john";              // snake_case
const USER_ROLE_ADMIN: &str = "admin"; // 定数はSCREAM_SNAKE_CASE
fn get_user_by_id(id: &str) {}       // snake_case
struct TaskManager {}                // PascalCase
```

### Tauri⇔フロントエンド通信規約

#### 概要

TauriはJavaScriptの`camelCase`パラメータをRustの`snake_case`に自動変換します。この仕組みを理解し、適切に活用することで、各言語の慣例に従ったコードを書きながら正しい通信を実現できます。

#### パラメータ命名ルール

**JavaScript側（camelCase）** ⇔ **Rust側（snake_case）** の対応：

```typescript
// JavaScript/TypeScript側 - camelCaseを使用
await invoke('update_task', { 
  projectId: 'project-123',        // Rust側: project_id
  taskId: 'task-456',             // Rust側: task_id  
  partialSettings: {...}          // Rust側: partial_settings
});

await invoke('create_task_assignment', {
  taskAssignment: {               // Rust側: task_assignment
    task_id: 'task-123',
    user_id: 'user-456'
  }
});
```

```rust
// Rust側 - snake_caseを使用
#[tauri::command]
pub async fn update_task(
    project_id: String,           // JavaScript側: projectId
    task_id: String,              // JavaScript側: taskId  
    partial_settings: PartialSettings // JavaScript側: partialSettings
) -> Result<bool, String> {
    // 実装
}

#[tauri::command]
pub async fn create_task_assignment(
    task_assignment: TaskAssignment  // JavaScript側: taskAssignment
) -> Result<bool, String> {
    // 実装
}
```

#### 戻り値の統一

**void返却コマンドの戻り値統一**：

```rust
// Rust側 - 成功時は() (Unit型)を返す
#[tauri::command]
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    // 保存処理
    Ok(()) // Unit型を返す
}
```

```typescript
// JavaScript側 - 成功時はtrueとして扱う
async saveSettings(settings: Settings): Promise<boolean> {
  try {
    await invoke('save_settings', { settings });
    return true; // void成功 = true
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false; // エラー = false
  }
}
```

#### エラーハンドリング統一

```typescript
// 統一されたエラーハンドリングパターン
async function tauriServiceMethod<T>(
  command: string, 
  params?: object
): Promise<T | null> {
  try {
    const result = await invoke(command, params) as T;
    return result;
  } catch (error) {
    console.error(`Failed to execute ${command}:`, error);
    return null;
  }
}

// boolean返却の場合
async function tauriBooleanMethod(
  command: string, 
  params?: object
): Promise<boolean> {
  try {
    await invoke(command, params);
    return true;
  } catch (error) {
    console.error(`Failed to execute ${command}:`, error);
    return false;
  }
}
```

#### 実装チェックリスト

**JavaScript/TypeScript実装時**:
- [ ] パラメータ名は`camelCase`で記述
- [ ] Rust側の`snake_case`関数パラメータに対応させる
- [ ] void返却コマンドは成功時`true`、失敗時`false`を返す
- [ ] エラーハンドリングを適切に実装
- [ ] コンソールログでエラー内容を出力

**Rust実装時**:
- [ ] 関数パラメータは`snake_case`で記述  
- [ ] JavaScript側の`camelCase`パラメータに対応
- [ ] `Result<T, String>`でエラーハンドリング
- [ ] 適切なエラーメッセージを提供

#### 注意事項

1. **自動変換の範囲**: Tauriの自動変換はパラメータ名のみ。構造体フィールド名やEnumバリアントは対象外
2. **一貫性の維持**: プロジェクト全体で同じパターンを使用
3. **型安全性**: TypeScriptの型定義とRustの構造体定義を一致させる
4. **テスト**: 通信部分は実際のTauri環境でのテストを推奨

## TypeScript/Svelte 規約

### 型定義

#### 厳密な型指定
```typescript
// 良い例
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignee?: User;
}

// 悪い例
interface Task {
  id: any;
  title: string;
  status: string;
  assignee: any;
}
```

#### Optional vs Required
```typescript
// 明確な区別
interface CreateTaskRequest {
  title: string;           // 必須
  description?: string;    // オプション
  dueDate?: Date;         // オプション
}

interface Task {
  id: string;             // 作成後は必須
  title: string;          // 必須
  description: string;    // 作成後は空文字でも必須
  dueDate?: Date;        // 常にオプション
}
```

### 関数・メソッド

#### 純粋関数の推奨
```typescript
// 良い例 - 純粋関数
function calculateProgress(completedTasks: number, totalTasks: number): number {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

// 良い例 - 副作用が必要な場合は明確に分離
function updateTaskInStore(task: Task): void {
  taskStore.updateTask(task);
}

// 悪い例 - 副作用を含む関数
function calculateProgressAndUpdate(completedTasks: number, totalTasks: number): number {
  const progress = Math.round((completedTasks / totalTasks) * 100);
  // 副作用 - 関数名から推測できない
  updateProgressUI(progress);
  return progress;
}
```

#### エラーハンドリング
```typescript
// 良い例 - 明示的なエラーハンドリング
async function fetchTasks(): Promise<Task[] | null> {
  try {
    const response = await api.getTasks();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return null;
  }
}

// Result型を使用したエラーハンドリング
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchTasksWithResult(): Promise<Result<Task[]>> {
  try {
    const response = await api.getTasks();
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### Svelte コンポーネント

#### Props定義
```typescript
// 良い例 - 明確なPropsインターフェース
<script lang="ts">
  interface Props {
    task: Task;
    readonly?: boolean;
    onUpdate?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
  }
  
  let { 
    task, 
    readonly = false, 
    onUpdate = () => {}, 
    onDelete = () => {} 
  }: Props = $props();
</script>
```

#### 状態管理
```typescript
// 良い例 - 適切な$state使用
let isEditing = $state<boolean>(false);
let formData = $state<CreateTaskRequest>({
  title: '',
  description: ''
});

// 良い例 - 派生状態は$derived使用
const isFormValid = $derived(
  formData.title.trim().length > 0
);

// 悪い例 - 手動で状態を同期
let isFormValid = $state<boolean>(false);
$effect(() => {
  isFormValid = formData.title.trim().length > 0; // $derivedを使うべき
});
```

### Import/Export

#### Import順序
```typescript
// 1. Node modules
import { invoke } from '@tauri-apps/api/tauri';
import { writable } from 'svelte/store';

// 2. 内部ライブラリ（$libから開始）
import type { Task } from '$lib/types';
import { taskService } from '$lib/services/task-service';
import TaskItem from '$lib/components/task-item.svelte';

// 3. 相対パス
import './component.css';
```

#### Export規約
```typescript
// Named exportを優先
export { TaskManager } from './task-manager';
export type { Task, TaskStatus } from './types';

// Default exportは単一の主要エクスポートのみ
export default class TaskService {
  // ...
}
```

## Rust 規約

### 構造体・Enum定義

#### 構造体
```rust
// 良い例 - 明確な構造体定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: TaskId,
    pub title: String,
    pub status: TaskStatus,
    pub assignee_id: Option<UserId>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Builder パターンの使用
impl Task {
    pub fn builder() -> TaskBuilder {
        TaskBuilder::default()
    }
}

#[derive(Default)]
pub struct TaskBuilder {
    title: Option<String>,
    status: Option<TaskStatus>,
    assignee_id: Option<UserId>,
}

impl TaskBuilder {
    pub fn title<S: Into<String>>(mut self, title: S) -> Self {
        self.title = Some(title.into());
        self
    }
    
    pub fn build(self) -> Result<Task, String> {
        let title = self.title.ok_or("Title is required")?;
        Ok(Task {
            id: TaskId::new(),
            title,
            status: self.status.unwrap_or(TaskStatus::Todo),
            assignee_id: self.assignee_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }
}
```

#### Enum定義
```rust
// 良い例 - 明確なEnum定義
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Todo,
    InProgress,
    Completed,
    Cancelled,
}

impl TaskStatus {
    pub fn is_active(&self) -> bool {
        matches!(self, TaskStatus::Todo | TaskStatus::InProgress)
    }
    
    pub fn can_transition_to(&self, target: TaskStatus) -> bool {
        match (self, target) {
            (TaskStatus::Todo, TaskStatus::InProgress) => true,
            (TaskStatus::InProgress, TaskStatus::Completed) => true,
            (TaskStatus::InProgress, TaskStatus::Cancelled) => true,
            _ => false,
        }
    }
}
```

### エラーハンドリング

#### カスタムエラー型
```rust
// 良い例 - 構造化されたエラー定義
#[derive(Debug, thiserror::Error)]
pub enum TaskError {
    #[error("Task not found: {id}")]
    NotFound { id: TaskId },
    
    #[error("Invalid task status transition from {from:?} to {to:?}")]
    InvalidStatusTransition { from: TaskStatus, to: TaskStatus },
    
    #[error("Repository error: {0}")]
    Repository(#[from] RepositoryError),
    
    #[error("Validation error: {message}")]
    Validation { message: String },
}

// Result型の使用
pub type TaskResult<T> = Result<T, TaskError>;

// 使用例
pub async fn update_task_status(
    id: &TaskId, 
    new_status: TaskStatus
) -> TaskResult<Task> {
    let mut task = repository.find_by_id(id).await?
        .ok_or_else(|| TaskError::NotFound { id: *id })?;
    
    if !task.status.can_transition_to(new_status) {
        return Err(TaskError::InvalidStatusTransition {
            from: task.status,
            to: new_status,
        });
    }
    
    task.status = new_status;
    task.updated_at = Utc::now();
    
    repository.save(&task).await?;
    Ok(task)
}
```

### Option/Result処理規約

#### Option値の取り出し
```rust
// 1つだけならif let Someを使用
if let Some(user) = user_repository.find_by_id(&user_id).await? {
    return Ok(user.display_name);
}

// 複数ある場合はネストを避けるため一時変数に格納
let user = user_repository.find_by_id(&user_id).await?;
let project = project_repository.find_by_id(&project_id).await?;
let task = task_repository.find_by_id(&task_id).await?;

let (user, project, task) = match (user, project, task) {
    (Some(u), Some(p), Some(t)) => (u, p, t),
    _ => return Err(ServiceError::ResourceNotFound),
};

// 使用
process_task_assignment(&user, &project, &task).await?;
```

#### エラーチェーン
```rust
// 良い例 - エラーコンテキストの追加
use anyhow::{Context, Result};

pub async fn create_project_with_tasks(
    project_data: CreateProjectRequest
) -> Result<Project> {
    let project = project_service
        .create_project(project_data.project)
        .await
        .context("Failed to create project")?;
    
    for task_data in project_data.tasks {
        task_service
            .create_task(&project.id, task_data)
            .await
            .with_context(|| format!("Failed to create task: {}", task_data.title))?;
    }
    
    Ok(project)
}
```

## コード品質

### テスト記述

#### 単体テストの構造
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_task_status_transition_valid() {
        // Arrange
        let status = TaskStatus::Todo;
        let target = TaskStatus::InProgress;
        
        // Act
        let result = status.can_transition_to(target);
        
        // Assert
        assert!(result);
    }
    
    #[test]
    fn test_task_status_transition_invalid() {
        // Arrange
        let status = TaskStatus::Completed;
        let target = TaskStatus::Todo;
        
        // Act
        let result = status.can_transition_to(target);
        
        // Assert
        assert!(!result);
    }
}
```

```typescript
// TypeScript テスト例
describe('TaskService', () => {
  describe('calculateProgress', () => {
    it('should return 0 when no tasks exist', () => {
      // Arrange
      const completedTasks = 0;
      const totalTasks = 0;
      
      // Act
      const result = calculateProgress(completedTasks, totalTasks);
      
      // Assert
      expect(result).toBe(0);
    });
    
    it('should calculate correct percentage', () => {
      // Arrange
      const completedTasks = 3;
      const totalTasks = 10;
      
      // Act
      const result = calculateProgress(completedTasks, totalTasks);
      
      // Assert
      expect(result).toBe(30);
    });
  });
});
```

### ドキュメンテーション

#### コードコメント
```rust
/// タスクの進捗状況を計算します
/// 
/// # Arguments
/// 
/// * `completed_tasks` - 完了したタスク数
/// * `total_tasks` - 全タスク数
/// 
/// # Returns
/// 
/// 進捗のパーセンテージ（0-100）
/// 
/// # Examples
/// 
/// ```
/// let progress = calculate_progress(3, 10);
/// assert_eq!(progress, 30);
/// ```
pub fn calculate_progress(completed_tasks: usize, total_tasks: usize) -> u8 {
    if total_tasks == 0 {
        return 0;
    }
    ((completed_tasks * 100) / total_tasks) as u8
}
```

```typescript
/**
 * ユーザーのタスク一覧を取得します
 * 
 * @param userId - 対象ユーザーのID
 * @param options - 取得オプション
 * @returns Promise<Task[]> - タスク一覧
 * 
 * @example
 * ```typescript
 * const tasks = await getUserTasks('user-123', { includeCompleted: false });
 * ```
 */
export async function getUserTasks(
  userId: string, 
  options: GetTasksOptions = {}
): Promise<Task[]> {
  // 実装
}
```

## パフォーマンス規約

### フロントエンド

#### 適切なリアクティビティ使用
```typescript
// 良い例 - 必要最小限の状態管理
class TaskStore {
  private tasks = $state<Task[]>([]);
  
  // 派生状態を使用
  get completedTasks() {
    return $derived(this.tasks.filter(t => t.status === 'completed'));
  }
}

// 悪い例 - 冗長な状態管理
class TaskStore {
  private tasks = $state<Task[]>([]);
  private completedTasks = $state<Task[]>([]); // 冗長
  
  addTask(task: Task) {
    this.tasks.push(task);
    // 手動同期が必要 - バグの原因
    this.updateCompletedTasks();
  }
}
```

### バックエンド

#### 効率的なデータベースアクセス
```rust
// 良い例 - バッチ処理
pub async fn get_tasks_with_assignees(
    project_id: &ProjectId
) -> Result<Vec<TaskWithAssignee>> {
    // JOINを使用して1回のクエリで取得
    let query = r#"
        SELECT t.*, u.display_name as assignee_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.project_id = ?
    "#;
    
    database.query(query, &[project_id]).await
}

// 悪い例 - N+1問題
pub async fn get_tasks_with_assignees_slow(
    project_id: &ProjectId
) -> Result<Vec<TaskWithAssignee>> {
    let tasks = task_repository.find_by_project(project_id).await?;
    
    let mut result = Vec::new();
    for task in tasks {
        // 各タスクごとにクエリ実行 - N+1問題
        let assignee = if let Some(assignee_id) = &task.assignee_id {
            user_repository.find_by_id(assignee_id).await?
        } else {
            None
        };
        result.push(TaskWithAssignee { task, assignee });
    }
    
    Ok(result)
}
```

この規約に従って開発することで、保守性が高く、パフォーマンスに優れた一貫性のあるコードベースを維持できます。