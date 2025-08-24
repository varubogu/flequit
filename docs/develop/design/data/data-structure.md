# データ構造仕様

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
├── プロジェクト一覧 (Project[])
└── ローカル設定 (LocalSettings)

Account Document
└── アカウント情報 (Account)

User Document
└── ユーザー情報 (User)

Project Documents (project_id毎)
├── プロジェクト詳細データ
├── タスクリスト (TaskList[])
├── タスク (Task[])
├── サブタスク (SubTask[])
└── タグ (Tag[])
```

## 型システムと変換規則

### 型変換表

Flequitでは異なる層間で型変換を行います。以下の変換表に従って各データ型を管理します：

| Rust内部型 | TypeScript/フロントエンド | SQLite | Automerge JSON | 説明 |
|-----------|-------------------------|--------|----------------|------|
| `ProjectId` | `string` | `TEXT` | `string` | プロジェクト一意識別子（UUID v4） |
| `AccountId` | `string` | `TEXT` | `string` | アカウント一意識別子（UUID v4） |
| `UserId` | `string` | `TEXT` | `string` | ユーザー一意識別子（UUID v4） |
| `TaskId` | `string` | `TEXT` | `string` | タスク一意識別子（UUID v4） |
| `TaskListId` | `string` | `TEXT` | `string` | タスクリスト一意識別子（UUID v4） |
| `TagId` | `string` | `TEXT` | `string` | タグ一意識別子（UUID v4） |
| `SubTaskId` | `string` | `TEXT` | `string` | サブタスク一意識別子（UUID v4） |
| `DateTime<Utc>` | `string` | `TEXT` | `string` | ISO 8601形式日時文字列 |
| `Option<T>` | `T \| null` | `NULL` | `null` | Optional値 |
| `String` | `string` | `TEXT` | `string` | 文字列 |
| `i32` | `number` | `INTEGER` | `number` | 32bit整数 |
| `bool` | `boolean` | `INTEGER` | `boolean` | 真偽値（SQLiteは0/1） |
| Enum型 | `string` | `TEXT` | `string` | 列挙型（文字列として保存） |

### 注意点

- **UUID形式**: 全てのIDは`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`形式
- **日時形式**: `YYYY-MM-DDTHH:mm:ss.sssZ` (UTC) 
- **SQLite真偽値**: `true`=1, `false`=0で保存
- **Optional値**: 未設定時は`null`/`NULL`で統一

### SQLiteテーブル例

```sql
-- Project テーブル例
CREATE TABLE projects (
    id TEXT PRIMARY KEY,           -- ProjectId → TEXT (UUID)
    name TEXT NOT NULL,            -- String → TEXT
    description TEXT,              -- Option<String> → TEXT (NULL許可)
    color TEXT,                    -- Option<String> → TEXT (NULL許可)
    order_index INTEGER NOT NULL,  -- i32 → INTEGER
    is_archived INTEGER NOT NULL,  -- bool → INTEGER (0/1)
    status TEXT,                   -- Option<ProjectStatus> → TEXT (NULL許可)
    owner_id TEXT,                 -- Option<UserId> → TEXT (NULL許可)
    created_at TEXT NOT NULL,      -- DateTime<Utc> → TEXT (ISO 8601)
    updated_at TEXT NOT NULL       -- DateTime<Utc> → TEXT (ISO 8601)
);

-- Task テーブル例
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,           -- TaskId → TEXT (UUID)
    project_id TEXT NOT NULL,      -- ProjectId → TEXT (UUID)
    task_list_id TEXT,             -- Option<TaskListId> → TEXT (NULL許可)
    title TEXT NOT NULL,           -- String → TEXT
    description TEXT,              -- Option<String> → TEXT (NULL許可)
    status TEXT NOT NULL,          -- TaskStatus → TEXT (enum文字列)
    priority TEXT NOT NULL,        -- Priority → TEXT (enum文字列)
    importance TEXT NOT NULL,      -- Importance → TEXT (enum文字列)
    due_date TEXT,                 -- Option<DateTime<Utc>> → TEXT (NULL許可)
    start_date TEXT,               -- Option<DateTime<Utc>> → TEXT (NULL許可)
    end_date TEXT,                 -- Option<DateTime<Utc>> → TEXT (NULL許可)
    assignee_id TEXT,              -- Option<UserId> → TEXT (NULL許可)
    order_index INTEGER NOT NULL,  -- i32 → INTEGER
    is_archived INTEGER NOT NULL,  -- bool → INTEGER (0/1)
    created_at TEXT NOT NULL,      -- DateTime<Utc> → TEXT (ISO 8601)
    updated_at TEXT NOT NULL       -- DateTime<Utc> → TEXT (ISO 8601)
);
```

## データ型定義とサンプル

### 1. Settings Document

#### Structure

```json
{
  "projects": [
    {
      "id": "project-uuid-1",
      "name": "サンプルプロジェクト",
      "description": "プロジェクトの説明",
      "color": "#4CAF50",
      "order_index": 1,
      "is_archived": false,
      "status": "Active",
      "owner_id": "user-uuid-1",
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "local_settings": {
    "theme": "dark",
    "language": "ja"
  },
  "view_settings": [
    {
      "id": "view-daily-today",
      "key": "daily.today",
      "title": "今日",
      "icon": "calendar-today",
      "is_visible": true,
      "order_index": 1
    }
  ]
}
```

#### Type Definitions

##### Project
```typescript
interface Project {
  id: string;                    // プロジェクト一意識別子 (Rust: ProjectId → TS: string)
  name: string;                  // プロジェクト名（必須） (Rust: String → TS: string)
  description?: string;          // プロジェクト説明 (Rust: Option<String> → TS: string | null)
  color?: string;               // UI表示用カラーコード (Rust: Option<String> → TS: string | null)
  order_index: number;          // 表示順序 (Rust: i32 → TS: number)
  is_archived: boolean;         // アーカイブ状態 (Rust: bool → TS: boolean)
  status?: "Active" | "Completed" | "Suspended"; // プロジェクトステータス (Rust: Option<ProjectStatus> → TS: string | null)
  owner_id?: string;            // プロジェクトオーナーのユーザーID (Rust: Option<UserId> → TS: string | null)
  created_at: string;           // 作成日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
  updated_at: string;           // 最終更新日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

##### LocalSettings
```typescript
interface LocalSettings {
  theme: string;                // UIテーマ（"light" | "dark" | "system"） (Rust: String → TS: string)
  language: string;             // 言語設定（ISO 639-1形式） (Rust: String → TS: string)
}
```

##### ViewItem
```typescript
interface ViewItem {
  id: string;                   // ビューアイテム一意識別子 (Rust: String → TS: string)
  key: string;                  // 設定キー（ドット記法） (Rust: String → TS: string)
  title: string;                // 表示タイトル (Rust: String → TS: string)
  icon: string;                 // アイコン名 (Rust: String → TS: string)
  is_visible: boolean;          // 表示状態 (Rust: bool → TS: boolean)
  order_index: number;          // 表示順序 (Rust: i32 → TS: number)
}
```

### 2. Account Document

#### Structure

```json
{
  "id": "account-uuid-1",
  "email": "user@example.com",
  "display_name": "ユーザー名",
  "avatar_url": "https://example.com/avatar.jpg",
  "provider": "local",
  "provider_id": null,
  "is_active": true,
  "created_at": "2024-01-01T10:00:00.000Z",
  "updated_at": "2024-01-01T10:00:00.000Z"
}
```

#### Type Definitions

##### Account
```typescript
interface Account {
  id: string;                   // アカウント一意識別子 (Rust: AccountId → TS: string)
  email?: string;               // メールアドレス (Rust: Option<String> → TS: string | null)
  display_name?: string;        // プロバイダー提供の表示名 (Rust: Option<String> → TS: string | null)
  avatar_url?: string;          // プロフィール画像URL (Rust: Option<String> → TS: string | null)
  provider: string;             // 認証プロバイダー名 (Rust: String → TS: string)
  provider_id?: string;         // プロバイダー側ユーザーID (Rust: Option<String> → TS: string | null)
  is_active: boolean;           // アカウント有効状態 (Rust: bool → TS: boolean)
  created_at: string;           // 作成日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
  updated_at: string;           // 最終更新日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

### 3. User Document

#### Structure

```json
{
  "id": "user-uuid-1",
  "account_id": "account-uuid-1",
  "username": "username",
  "display_name": "表示名",
  "email": "user@example.com",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "自己紹介文",
  "timezone": "Asia/Tokyo",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00.000Z",
  "updated_at": "2024-01-01T10:00:00.000Z"
}
```

#### Type Definitions

##### User
```typescript
interface User {
  id: string;                   // ユーザー一意識別子 (Rust: UserId → TS: string)
  account_id: string;           // 関連アカウントID (Rust: AccountId → TS: string)
  username: string;             // ユーザー名 (Rust: String → TS: string)
  display_name?: string;        // 表示名 (Rust: Option<String> → TS: string | null)
  email?: string;               // メールアドレス (Rust: Option<String> → TS: string | null)
  avatar_url?: string;          // アバターURL (Rust: Option<String> → TS: string | null)
  bio?: string;                 // 自己紹介 (Rust: Option<String> → TS: string | null)
  timezone?: string;            // タイムゾーン (Rust: Option<String> → TS: string | null)
  is_active: boolean;           // アクティブ状態 (Rust: bool → TS: boolean)
  created_at: string;           // 作成日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
  updated_at: string;           // 最終更新日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

### 4. Project Document

#### Structure

```json
{
  "project_id": "project-uuid-1",
  "task_lists": [
    {
      "id": "list-uuid-1",
      "project_id": "project-uuid-1",
      "name": "タスクリスト名",
      "description": "タスクリストの説明",
      "order_index": 1,
      "is_archived": false,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "tasks": [
    {
      "id": "task-uuid-1",
      "project_id": "project-uuid-1",
      "task_list_id": "list-uuid-1",
      "title": "タスクタイトル",
      "description": "タスクの詳細説明",
      "status": "Todo",
      "priority": "Medium",
      "importance": "High",
      "due_date": "2024-01-31T23:59:59.000Z",
      "start_date": "2024-01-01T09:00:00.000Z",
      "end_date": null,
      "assignee_id": "user-uuid-1",
      "order_index": 1,
      "is_archived": false,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "subtasks": [
    {
      "id": "subtask-uuid-1",
      "parent_task_id": "task-uuid-1",
      "title": "サブタスクタイトル",
      "description": "サブタスクの説明",
      "status": "Todo",
      "due_date": "2024-01-15T23:59:59.000Z",
      "assignee_id": "user-uuid-1",
      "order_index": 1,
      "is_completed": false,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "tags": [
    {
      "id": "tag-uuid-1",
      "project_id": "project-uuid-1",
      "name": "重要",
      "color": "#FF5722",
      "text_color": "#FFFFFF",
      "order_index": 1,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "project_members": [
    {
      "user_id": "user-uuid-1",
      "project_id": "project-uuid-1",
      "role": "Owner",
      "joined_at": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

#### Type Definitions

##### TaskList
```typescript
interface TaskList {
  id: string;                   // タスクリスト一意識別子 (Rust: TaskListId → TS: string)
  project_id: string;           // 所属プロジェクトID (Rust: ProjectId → TS: string)
  name: string;                 // タスクリスト名 (Rust: String → TS: string)
  description?: string;         // 説明 (Rust: Option<String> → TS: string | null)
  order_index: number;          // 表示順序 (Rust: i32 → TS: number)
  is_archived: boolean;         // アーカイブ状態 (Rust: bool → TS: boolean)
  created_at: string;           // 作成日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
  updated_at: string;           // 最終更新日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

##### Task
```typescript
interface Task {
  id: string;                   // タスク一意識別子 (Rust: TaskId → TS: string)
  project_id: string;           // 所属プロジェクトID (Rust: ProjectId → TS: string)
  task_list_id?: string;        // 所属タスクリストID (Rust: Option<TaskListId> → TS: string | null)
  title: string;                // タスクタイトル (Rust: String → TS: string)
  description?: string;         // 詳細説明 (Rust: Option<String> → TS: string | null)
  status: "Todo" | "InProgress" | "Done" | "Cancelled"; // タスクステータス (Rust: TaskStatus → TS: string)
  priority: "Low" | "Medium" | "High" | "Critical";     // 優先度 (Rust: Priority → TS: string)
  importance: "Low" | "Medium" | "High" | "Critical";   // 重要度 (Rust: Importance → TS: string)
  due_date?: string;            // 期限日時（ISO 8601） (Rust: Option<DateTime<Utc>> → TS: string | null)
  start_date?: string;          // 開始予定日時（ISO 8601） (Rust: Option<DateTime<Utc>> → TS: string | null)
  end_date?: string;            // 完了日時（ISO 8601） (Rust: Option<DateTime<Utc>> → TS: string | null)
  assignee_id?: string;         // 担当者ユーザーID (Rust: Option<UserId> → TS: string | null)
  order_index: number;          // 表示順序 (Rust: i32 → TS: number)
  is_archived: boolean;         // アーカイブ状態 (Rust: bool → TS: boolean)
  created_at: string;           // 作成日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
  updated_at: string;           // 最終更新日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

##### SubTask
```typescript
interface SubTask {
  id: string;                   // サブタスク一意識別子 (Rust: SubTaskId → TS: string)
  parent_task_id: string;       // 親タスクID (Rust: TaskId → TS: string)
  title: string;                // サブタスクタイトル (Rust: String → TS: string)
  description?: string;         // 説明 (Rust: Option<String> → TS: string | null)
  status: "Todo" | "InProgress" | "Done" | "Cancelled"; // ステータス (Rust: TaskStatus → TS: string)
  due_date?: string;            // 期限日時（ISO 8601） (Rust: Option<DateTime<Utc>> → TS: string | null)
  assignee_id?: string;         // 担当者ユーザーID (Rust: Option<UserId> → TS: string | null)
  order_index: number;          // 表示順序 (Rust: i32 → TS: number)
  is_completed: boolean;        // 完了状態 (Rust: bool → TS: boolean)
  created_at: string;           // 作成日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
  updated_at: string;           // 最終更新日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

##### Tag
```typescript
interface Tag {
  id: string;                   // タグ一意識別子 (Rust: TagId → TS: string)
  project_id: string;           // 所属プロジェクトID (Rust: ProjectId → TS: string)
  name: string;                 // タグ名 (Rust: String → TS: string)
  color: string;                // 背景色（HEXカラー） (Rust: String → TS: string)
  text_color: string;           // 文字色（HEXカラー） (Rust: String → TS: string)
  order_index: number;          // 表示順序 (Rust: i32 → TS: number)
  created_at: string;           // 作成日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
  updated_at: string;           // 最終更新日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

##### ProjectMember
```typescript
interface ProjectMember {
  user_id: string;              // メンバーのユーザーID (Rust: UserId → TS: string)
  project_id: string;           // 所属プロジェクトID (Rust: ProjectId → TS: string)
  role: "Owner" | "Admin" | "Member" | "Viewer"; // 権限役割 (Rust: MemberRole → TS: string)
  joined_at: string;            // 参加日時（ISO 8601） (Rust: DateTime<Utc> → TS: string)
}
```

## データアクセスパターン

### 基本的な読み書き操作

```rust
// Rust側でのデータアクセス例
use crate::models::project::Project;
use crate::types::id_types::ProjectId;

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
```

### ドキュメント間の関係性

1. **Settings → Project**: プロジェクト一覧からプロジェクト詳細へのナビゲーション
2. **Account ↔ User**: アカウント認証情報とユーザープロフィールの関連
3. **Project → User**: プロジェクトメンバーとユーザー情報の関連
4. **TaskList → Task → SubTask**: 階層的なタスク管理構造

### 同期と競合解決

Automergeの特性により、以下の利点があります：

- **自動競合解決**: CRDTアルゴリズムによる自動マージ
- **分散同期**: オフライン環境での操作と後の同期
- **履歴管理**: すべての変更履歴の保持
- **部分同期**: ドキュメント単位での効率的な同期
