# Automerge構造仕様

## 概要

Flequitアプリケーションのデータ管理は、ローカル環境でのCRDT（Conflict-free Replicated Data Type）による分散同期を目的としたAutomergeベースのシステムを採用しています。データは複数のAutomergeドキュメントに分散して保存され、将来的なクラウド同期や競合解決に対応できる設計となっています。

## Automergeドキュメント構成

### ドキュメント分割方針

データは以下の4つのAutomergeドキュメントに分割されます：

1. **Settings** (`settings.automerge`) - 設定情報とプロジェクト一覧
2. **Account** (`account.automerge`) - アカウント情報
3. **User** (`user.automerge`) - ユーザー情報
4. **Project** (`project_{id}.automerge`) - 各プロジェクト固有のデータ

### ドキュメント間の関係

```
Settings Document
├── 個人の設定 (Settings)
├── カスタム日付フォーマット設定（CustomDateFormat[]）
├── カスタム日時フォーマット設定（CustomDateTimeFormat[]）
├──
├──
├──
└── ローカル設定 (LocalSettings)

Account Document
├── ローカルアカウント (Account)
└── サーバーアカウント配列 (Account[])

User Document
└── ユーザー情報配列 (User[]) ※追加・更新のみ、削除不可

Project Documents (project_id毎)
├── プロジェクト詳細データ
├── タスクリスト (TaskList[])
├── タスク (Task[])
├── サブタスク (SubTask[])
├── タグ (Tag[])
└── メンバー (Member[])
```


## データアクセスパターン

### 基本的な読み書き操作

```rust
// Rust側でのデータアクセス例
use crate::models::project::Project;
use crate::models::user::User;
use crate::types::id_types::{ProjectId, UserId};

// Settings Documentからプロジェクト一覧を取得
let projects: Vec<Project> = document_manager.load_data(
    &DocumentType::Settings,
    "projects"
).await?;

// Project Documentからタスク一覧を取得
let project_id = ProjectId::from("project-uuid-1");
let tasks: Vec<Task> = document_manager.load_data(
    &DocumentType::Project(project_id.to_string()),
    "tasks"
).await?;

// User Documentからユーザー一覧を取得（配列形式）
let users: Vec<User> = document_manager.load_data(
    &DocumentType::User,
    "users"
).await?;

// 特定ユーザーのプロフィールを取得
let user_id = UserId::from("public-user-uuid-1");
let specific_user: Option<User> = users.into_iter()
    .find(|user| user.id == user_id);
```

```typescript
// TypeScript側でのTauriコマンド呼び出し例
import { invoke } from '@tauri-apps/api/tauri';

// プロジェクト一覧取得 (Rust: Vec<Project> → TS: Project[])
const projects: Project[] = await invoke('get_projects');

// タスク一覧取得 (Rust: Vec<Task> → TS: Task[])
const tasks: Task[] = await invoke('get_tasks', {
  projectId: 'project-uuid-1' // TS: string → Rust: ProjectId
});

// ユーザー一覧取得（配列形式） (Rust: Vec<User> → TS: User[])
const users: User[] = await invoke('get_users');

// ユーザーTree構造（担当タスク・サブタスク含む）を取得
const userTree: UserTree = await invoke('get_user_with_assignments', {
  userId: 'public-user-uuid-1'
});

// タグTree構造（関連タスク・サブタスク含む）を取得
const tagTree: TagTree = await invoke('get_tag_with_relations', {
  tagId: 'tag-uuid-1'
});

// タスクに担当者を割り当て（正規化された紐づけテーブル使用）
await invoke('assign_task_to_user', {
  taskId: 'task-uuid-1',
  userId: 'public-user-uuid-1'
});

// サブタスクにタグを付与（正規化された紐づけテーブル使用）
await invoke('add_tag_to_subtask', {
  subtaskId: 'subtask-uuid-1',
  tagId: 'tag-uuid-1'
});

// 繰り返しルールをタスクに関連付け
await invoke('associate_recurrence_rule_to_task', {
  taskId: 'task-uuid-1',
  recurrenceRuleId: 'recurrence-rule-uuid-1'
});

// 自分のプロフィール更新（編集権限チェックあり）
const updatedProfile: User = await invoke('update_user_profile', {
  userProfile: {
    id: 'public-user-uuid-1',
    username: 'new_username',
    display_name: '新しい表示名',
    // ... other fields
  }
});
```

### ドキュメント間の関係性

1. **Settings → Project**: プロジェクト一覧からプロジェクト詳細へのナビゲーション
2. **Account ↔ User**: アカウント認証情報（ローカル/サーバー）とユーザープロフィールの関連
3. **Project → User**: プロジェクトメンバー・タスク担当者とユーザー情報の関連（User.idで参照）
4. **TaskList → Task → SubTask**: 階層的なタスク管理構造

### User Documentの特別な操作制約

User Documentは他のドキュメントと異なり、以下の特別な制約があります：

#### データ操作制約
- **追加**: 新しいユーザープロフィールの追加は常に可能
- **更新**: 既存のユーザープロフィールの更新は可能
- **削除**: ユーザープロフィールの削除は不可（情報蓄積方式）
- **編集権限**: 自分のAccount.user_idにマッチするプロフィールのみ編集可能

#### データ特性
- **公開情報**: 全てのユーザープロフィールは他のユーザーから参照可能
- **情報蓄積**: プロジェクト参加者や担当者の情報を継続的に蓄積
- **プロフィール管理**: 自分と他人の公開プロフィール情報として機能

#### 実装における注意点
```rust
// 編集可能なプロフィールの判定例
fn can_edit_user_profile(current_account: &Account, target_user_id: &UserId) -> bool {
    current_account.user_id == *target_user_id
}

// ユーザープロフィール更新の例（削除は行わない）
fn update_user_profile(users: &mut Vec<User>, updated_user: User) -> Result<()> {
    if let Some(existing_user) = users.iter_mut().find(|u| u.id == updated_user.id) {
        // 既存プロフィールを更新
        *existing_user = updated_user;
    } else {
        // 新しいプロフィールを追加
        users.push(updated_user);
    }
    Ok(())
}
```

### 同期と競合解決

Automergeの特性により、以下の利点があります：

- **自動競合解決**: CRDTアルゴリズムによる自動マージ
- **分散同期**: オフライン環境での操作と後の同期
- **履歴管理**: すべての変更履歴の保持
- **部分同期**: ドキュメント単位での効率的な同期
