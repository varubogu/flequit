# Automerge-Repo 概念設計書

タスク管理アプリケーションのデータ管理システム概念設計。
Tauri → Commands → Service → Repository の3層階層構造で、Automerge-RepoによるCRDT操作と型安全な構造体操作を提供する。

## 設計概要

### アーキテクチャ
```
Frontend (SvelteKit)
    ↓ Tauri Invoke
Tauri Commands Layer
    ↓ ビジネスロジック呼び出し
Service Layer (Business Logic)
    ├── automerge/ (機能分散)
    │   ├── project_service.rs
    │   ├── task_service.rs
    │   ├── subtask_service.rs
    │   ├── tag_service.rs
    │   └── user_service.rs
    ↓ データアクセス
Repository Layer (Data Access + CRDT操作)
    ├── automerge/
    │   ├── project_repository.rs (Automerge-Repo統合)
    │   ├── task_repository.rs (Automerge-Repo統合)
    │   ├── subtask_repository.rs (Automerge-Repo統合)
    │   ├── tag_repository.rs (Automerge-Repo統合)
    │   ├── user_repository.rs (Automerge-Repo統合)
    │   └── automerge_storage.rs (共通ストレージ)
```

### レイヤー責務
- **Commands Layer**: 
  - Tauri invoke関数の公開
  - 入力検証、結果変換
  - Serviceレイヤーの呼び出し

- **Service Layer**: 
  - ビジネスロジック
  - トランザクション管理
  - 権限チェック
  - **automerge子階層**: 機能別サービス（Project、Task、Subtask、Tag、User）

- **Repository Layer**: 
  - データアクセス抽象化
  - CRUD操作
  - 型変換
  - Automerge-Repo CRDT操作統合
  - **automerge子階層**: Automerge-Repo統合リポジトリ
  - **automerge_storage.rs**: 共通のAutomerge-Repoストレージ管理

### データフロー
```
Frontend Request → Commands Layer → Service Layer → Repository Layer
                                                        ↓
                  Rust構造体 ←--[serde]--> Automerge-Repo CRDT Document
                                                        ↓
                              Local Storage (SQLite) ←→ Network Sync
```

## プロジェクト構造

```
src-tauri/src/
├── commands/                   # Tauriコマンド層
│   ├── project_commands.rs
│   ├── task_commands.rs
│   ├── subtask_commands.rs
│   ├── tag_commands.rs
│   ├── user_commands.rs
│   └── mod.rs
├── services/                   # ビジネスロジック層
│   ├── automerge/              # Automerge関連サービス
│   │   ├── project_service.rs
│   │   ├── task_service.rs
│   │   ├── subtask_service.rs
│   │   ├── tag_service.rs
│   │   ├── user_service.rs
│   │   └── mod.rs
│   └── mod.rs
├── repositories/               # データアクセス層
│   ├── automerge/              # Automerge-Repo関連リポジトリ
│   │   ├── project_repository.rs    # プロジェクト操作
│   │   ├── task_repository.rs       # タスク操作
│   │   ├── subtask_repository.rs    # サブタスク操作
│   │   ├── tag_repository.rs        # タグ操作
│   │   ├── user_repository.rs       # ユーザー操作
│   │   ├── automerge_storage.rs     # 共通Automerge-Repoストレージ
│   │   └── mod.rs
│   └── mod.rs
├── types/                      # 型定義
│   ├── project_types.rs
│   ├── task_types.rs
│   ├── user_types.rs
│   └── mod.rs
├── errors/                     # エラー型定義
│   ├── service_error.rs
│   ├── repository_error.rs
│   ├── command_error.rs
│   └── mod.rs
└── main.rs
```

## データ階層構造

```
main_document/
├── projects/
│   └── {project_id}/
│       ├── info (Project構造体)
│       ├── tasks/
│       │   └── {task_id}/
│       │       ├── info (Task構造体)
│       │       └── subtasks/
│       │           └── {subtask_id}/ (Subtask構造体)
│       └── members/
│           └── {user_id}/ (ProjectMember構造体)
├── global_tags/
│   └── {tag_id}/ (Tag構造体)
└── users/
    └── {user_id}/ (User構造体)
```

## 階層的データアクセス API設計

### 基本パターン
```
// レベル1: ルート直下 (projects, global_tags, users)
set_project(project: &Project) -> Result<(), RepositoryError>
get_project(project_id: &str) -> Result<Option<Project>, RepositoryError>
list_projects() -> Result<Vec<Project>, RepositoryError>

// レベル2: プロジェクト内 (tasks, members)  
set_task(project_id: &str, task: &Task) -> Result<(), RepositoryError>
get_task(project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError>
list_tasks(project_id: &str) -> Result<Vec<Task>, RepositoryError>

// レベル3: タスク内 (subtasks)
set_subtask(project_id: &str, task_id: &str, subtask: &Subtask) -> Result<(), RepositoryError>
get_subtask(project_id: &str, task_id: &str, subtask_id: &str) -> Result<Option<Subtask>, RepositoryError>
list_subtasks(project_id: &str, task_id: &str) -> Result<Vec<Subtask>, RepositoryError>
```

## エラーハンドリング

### エラー変換フロー
```
Repository Error → Service Error → Command Error → Frontend
```

### 各層の役割
- **RepositoryError**: データアクセスエラー
- **ServiceError**: ビジネスロジックエラー（RepositoryErrorからの自動変換含む）
- **CommandError**: UI表示用エラー（SerializationError等）

## 主要機能

### Automerge-Repo統合
- CRDT操作による自動マージ
- 競合解決の自動化
- 履歴管理機能

### 同期機能
- リアルタイム同期
- Storage Plugin統合（SQLite）
- Network Plugin統合（WebSocket/HTTP）
- オフライン対応

### データ管理
- 型安全な構造体操作
- 階層的データアクセス
- トランザクション管理