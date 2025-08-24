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
  id: string;                    // プロジェクト一意識別子
  name: string;                  // プロジェクト名（必須）
  description?: string;          // プロジェクト説明
  color?: string;               // UI表示用カラーコード
  order_index: number;          // 表示順序
  is_archived: boolean;         // アーカイブ状態
  status?: "Active" | "Completed" | "Suspended"; // プロジェクトステータス
  owner_id?: string;            // プロジェクトオーナーのユーザーID
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 最終更新日時（ISO 8601）
}
```

##### LocalSettings
```typescript
interface LocalSettings {
  theme: string;                // UIテーマ（"light" | "dark" | "system"）
  language: string;             // 言語設定（ISO 639-1形式）
}
```

##### ViewItem
```typescript
interface ViewItem {
  id: string;                   // ビューアイテム一意識別子
  key: string;                  // 設定キー（ドット記法）
  title: string;                // 表示タイトル
  icon: string;                 // アイコン名
  is_visible: boolean;          // 表示状態
  order_index: number;          // 表示順序
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
  id: string;                   // アカウント一意識別子
  email?: string;               // メールアドレス
  display_name?: string;        // プロバイダー提供の表示名
  avatar_url?: string;          // プロフィール画像URL
  provider: string;             // 認証プロバイダー名
  provider_id?: string;         // プロバイダー側ユーザーID
  is_active: boolean;           // アカウント有効状態
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 最終更新日時（ISO 8601）
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
  id: string;                   // ユーザー一意識別子
  account_id: string;           // 関連アカウントID
  username: string;             // ユーザー名
  display_name?: string;        // 表示名
  email?: string;               // メールアドレス
  avatar_url?: string;          // アバターURL
  bio?: string;                 // 自己紹介
  timezone?: string;            // タイムゾーン
  is_active: boolean;           // アクティブ状態
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 最終更新日時（ISO 8601）
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
  id: string;                   // タスクリスト一意識別子
  project_id: string;           // 所属プロジェクトID
  name: string;                 // タスクリスト名
  description?: string;         // 説明
  order_index: number;          // 表示順序
  is_archived: boolean;         // アーカイブ状態
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 最終更新日時（ISO 8601）
}
```

##### Task
```typescript
interface Task {
  id: string;                   // タスク一意識別子
  task_list_id: string;         // 所属タスクリストID
  title: string;                // タスクタイトル
  description?: string;         // 詳細説明
  status: "Todo" | "InProgress" | "Done" | "Cancelled"; // タスクステータス
  priority: "Low" | "Medium" | "High" | "Critical";     // 優先度
  importance: "Low" | "Medium" | "High" | "Critical";   // 重要度
  due_date?: string;            // 期限日時（ISO 8601）
  start_date?: string;          // 開始予定日時（ISO 8601）
  end_date?: string;            // 完了日時（ISO 8601）
  assignee_id?: string;         // 担当者ユーザーID
  order_index: number;          // 表示順序
  is_archived: boolean;         // アーカイブ状態
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 最終更新日時（ISO 8601）
}
```

##### SubTask
```typescript
interface SubTask {
  id: string;                   // サブタスク一意識別子
  parent_task_id: string;       // 親タスクID
  title: string;                // サブタスクタイトル
  description?: string;         // 説明
  status: "Todo" | "InProgress" | "Done" | "Cancelled"; // ステータス
  due_date?: string;            // 期限日時（ISO 8601）
  assignee_id?: string;         // 担当者ユーザーID
  order_index: number;          // 表示順序
  is_completed: boolean;        // 完了状態
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 最終更新日時（ISO 8601）
}
```

##### Tag
```typescript
interface Tag {
  id: string;                   // タグ一意識別子
  project_id: string;           // 所属プロジェクトID
  name: string;                 // タグ名
  color: string;                // 背景色（HEXカラー）
  text_color: string;           // 文字色（HEXカラー）
  order_index: number;          // 表示順序
  created_at: string;           // 作成日時（ISO 8601）
  updated_at: string;           // 最終更新日時（ISO 8601）
}
```

##### ProjectMember
```typescript
interface ProjectMember {
  user_id: string;              // メンバーのユーザーID
  project_id: string;           // 所属プロジェクトID
  role: "Owner" | "Admin" | "Member" | "Viewer"; // 権限役割
  joined_at: string;            // 参加日時（ISO 8601）
}
```

## データアクセスパターン

### 基本的な読み書き操作

```typescript
// Settings Documentからプロジェクト一覧を取得
const projects: Project[] = await documentManager.load_data(
  DocumentType.Settings, 
  "projects"
);

// Project Documentからタスク一覧を取得  
const tasks: Task[] = await documentManager.load_data(
  DocumentType.Project(projectId),
  "tasks"
);
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
