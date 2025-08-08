# Automerge-Repo 概念設計書

タスク管理アプリケーションのデータ管理システム概念設計。
Tauri → Commands → Service → Repository の3階層呼び出し構造で、Automerge-RepoによるCRDT操作と型安全な構造体操作を提供する。

## 設計概要

### アーキテクチャ
```
Frontend (SvelteKit)
    ↓ Tauri Invoke
Commands Layer (Tauri Command)
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
    │   ├── project_repository.rs (SQLite + Automerge統合)
    │   ├── task_repository.rs (SQLite + Automerge統合)
    │   ├── subtask_repository.rs (SQLite + Automerge統合)
    │   ├── tag_repository.rs (SQLite + Automerge統合)
    │   ├── user_repository.rs (SQLite + Automerge統合)
    │   ├── automerge_storage.rs (Automerge履歴・同期管理)
    │   └── sqlite_storage.rs (SQLite最新データ管理)
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
  - 2層ストレージ管理（SQLite：最新データ、Automerge：履歴・同期）
  - CRUD操作（読み込み：SQLite優先、書き込み：両方更新）
  - 型変換
  - **automerge子階層**: 2層ストレージ統合リポジトリ
  - **sqlite_storage.rs**: SQLite最新データ管理
  - **automerge_storage.rs**: Automerge履歴・同期管理

### データフロー
```
Frontend Request → Commands Layer → Service Layer → Repository Layer
                                                        ↓
                           読み込み：SQLite (最新データ) ← Rust構造体
                           書き込み：SQLite + Automerge ← Rust構造体
                                                        ↓
                              SQLite (最新データ) + Automerge (履歴・同期)
                                                        ↓
                                      Network Sync ←→ Automerge Document
```

### Automerge Document操作フロー

Repository Layer内での基本操作パターン:
1. Document取得 → 2. 型変換 → 3. 構造体操作 → 4. Document更新 → 5. 保存・同期

CRDT操作の種類:
- Insert: 新規エンティティ追加
- Update: 既存データ部分更新
- Delete: **論理削除のみ**（物理削除は行わない）

詳細な実装例については別紙「automerge-document-operations.md」を参照。

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
│   ├── automerge/              # 2層ストレージ統合リポジトリ
│   │   ├── project_repository.rs    # プロジェクト操作（SQLite + Automerge）
│   │   ├── task_repository.rs       # タスク操作（SQLite + Automerge）
│   │   ├── subtask_repository.rs    # サブタスク操作（SQLite + Automerge）
│   │   ├── tag_repository.rs        # タグ操作（SQLite + Automerge）
│   │   ├── user_repository.rs       # ユーザー操作（SQLite + Automerge）
│   │   ├── sqlite_storage.rs        # SQLite最新データ管理
│   │   ├── automerge_storage.rs     # Automerge履歴・同期管理
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

### Automergeドキュメント分割
```
global_document/                    # グローバル情報ドキュメント
├── global_tags/
│   └── {tag_id}/ (Tag構造体)
└── users/
    └── {user_id}/ (User構造体)

project_document_{project_id}/      # プロジェクト別ドキュメント
├── info (Project構造体)
├── tasks/
│   └── {task_id}/
│       ├── info (Task構造体)
│       └── subtasks/
│           └── {subtask_id}/ (Subtask構造体)
└── members/
    └── {user_id}/ (ProjectMember構造体)
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

### データ整合性エラー

**削除済みエンティティへの操作**:
- 論理削除済み・物理削除済みエンティティへの操作は失敗
- RepositoryErrorとしてエラーを返却

**バリデーションエラー**:
- 必須フィールド不足、型制約違反等
- 入力値検証はService Layer、データ制約はRepository Layerで実施

**エラー通知**:
- 全てのエラーはCommand戻り値としてフロントエンドに通知
- フロントエンドでユーザーへの表示を実装

### 同期エラー

**リトライ戦略**:
- 周期的同期：次回同期時に再実行
- 手動同期：ユーザーが再度実行

**オフライン対応**:
- ローカル動作が基本、同期はオプション機能
- ネットワーク切断時も通常動作継続

## 主要機能

### Automerge-Repo統合
- CRDT操作による自動マージ
- 競合解決の自動化
- 履歴管理機能

### 同期機能
- ローカルファースト設計（SQLiteベース）
- 増分同期：Automergeが自動処理
- 競合検知：同期実行時に自動解決
- 同期対象：Webバックエンドサーバー（※自分でセルフホスティング可）、クラウドストレージ
- オフライン動作：標準機能

### データ管理
- 型安全な構造体操作
- 階層的データアクセス
- トランザクション管理

### 型安全性
- Rust厳格型システムによる型保証
- 必須フィールド：id、作成日時、更新日時
- その他フィールド：全てOptional（将来の拡張性考慮）
- 型変換失敗：不正ドキュメントとしてエラー処理

## パフォーマンス最適化

### 2層ストレージアーキテクチャ
- **SQLite**: 最新データの高速アクセス、インデックス・クエリ最適化
- **Automerge**: 履歴管理・同期機能に特化
- **メモリ効率**: 必要な最新データのみメモリ展開
- **スケーラビリティ**: データ量増加時も実行時パフォーマンス維持

### データアクセスパターン
- **読み込み**: SQLiteから最新データを取得（高速）
- **書き込み**: SQLite + Automerge両方更新（整合性保証）
- **同期**: Automergeから変更をSQLiteに反映
- **履歴**: Automergeから過去データアクセス

### Automergeドキュメント粒度
- **粒度単位**: プロジェクト1つ = Automergeドキュメント1つ
- **含有データ**: プロジェクト情報、全タスク、全サブタスク、メンバー情報
- **設計根拠**:
  - データ一貫性：プロジェクト内エンティティの整合性を1ドキュメントで保証
  - トランザクション境界：プロジェクト内の複数変更を1トランザクションで処理
  - 権限管理：プロジェクト単位でのアクセス制御が自然
  - パフォーマンス：2層アーキテクチャにより大きなドキュメントも実行時影響軽微
- **グローバルデータ**: ユーザー情報、グローバルタグは別途全体ドキュメントで管理
