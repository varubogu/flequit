# Automerge-Repo 概念設計書

タスク管理アプリケーションのデータ管理システム概念設計。
Tauri → Commands → Facade → Service → Repository の4階層呼び出し構造で、クリーンアーキテクチャとAutomerge-RepoによるCRDT操作を提供する。

## 設計概要

### アーキテクチャ

```
Frontend (SvelteKit)
    ↓ Tauri Invoke
Commands Layer (Tauri Command)
    ↓ ファサード呼び出し
Facade Layer (Application Facade)
    ↓ ビジネスロジック呼び出し
Service Layer (Business Logic)
    ↓ データアクセス
Repository Layer (Data Access Layer)
    ├── local_automerge/ (Automerge実装)
    ├── local_sqlite/ (SQLite実装)
    ├── cloud_automerge/ (クラウドストレージのAutomerge実装)
    └── web/ (Webサーバー実装)
```

### レイヤー責務

- **Commands Layer**:
  - Tauri invoke関数の公開
  - 入力検証、結果変換
  - Facadeレイヤーの呼び出し

- **Facade Layer**:
  - アプリケーション層の統合ポイント
  - 複数サービスの協調処理
  - トランザクション境界の管理
  - コマンドモデルへの変換

- **Service Layer**:
  - ドメインビジネスロジック
  - エンティティ間の整合性維持
  - 権限・バリデーションチェック
  - ストレージ実装に依存しない抽象化

- **Repository Layer**:
  - データアクセスの具象実装
  - 複数ストレージタイプの実装
    - **local_automerge/**: ローカルAutomerge実装
    - **local_sqlite/**: ローカルSQLite実装
    - **cloud_automerge/**: クラウドAutomerge実装
    - **web/**: Webサーバー実装
  - CRUD操作とデータ永続化
  - 型変換・シリアライゼーション

### データフロー

```
Frontend Request → Commands Layer → Facade Layer → Service Layer → Repository Layer
                                                                        ↓
                                                    Repository実装による分岐処理
                                                    ├── local_automerge/
                                                    ├── local_sqlite/
                                                    ├── cloud_automerge/
                                                    └── web/
                                                                        ↓
                                            選択されたストレージでのデータ操作
                                                                        ↓
                                                    Network Sync (必要に応じて)
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
│   └── mod.rs                  # Tauri invoke関数の公開
├── facades/                    # アプリケーションファサード層
│   └── mod.rs                  # 複数サービスの協調処理
├── services/                   # ドメインビジネスロジック層
│   └── mod.rs                  # ストレージ非依存のビジネスロジック
├── repositories/               # データアクセス層（複数実装）
│   ├── local_automerge/        # ローカルAutomerge実装
│   │   ├── document_manager.rs
│   │   ├── project.rs
│   │   ├── account.rs
│   │   ├── user.rs
│   │   └── settings.rs
│   ├── local_sqlite/           # ローカルSQLite実装
│   │   └── mod.rs
│   ├── cloud_automerge/        # クラウドAutomerge実装
│   │   └── mod.rs
│   ├── web/                    # Webサーバー実装
│   │   └── mod.rs
│   ├── base_repository_trait.rs     # 基底リポジトリトレイト
│   ├── project_repository_trait.rs  # プロジェクトリポジトリトレイト
│   ├── task_list_repository_trait.rs # タスクリストリポジトリトレイト
│   └── mod.rs
├── models/                     # データモデル層
│   ├── project.rs
│   ├── account.rs
│   ├── user.rs
│   ├── task.rs
│   ├── task_list.rs
│   ├── tag.rs
│   ├── command/                # コマンドモデル（フロントエンド⇔バックエンド）
│   └── mod.rs
├── types/                      # 型定義・列挙型
│   └── mod.rs
├── errors/                     # エラー型定義
│   └── mod.rs
└── main.rs
```

## データ階層構造

### Automergeドキュメント分割

現在の実装では、以下の4つのAutomergeドキュメントに分割されています：

```
settings.automerge                 # 設定・プロジェクト一覧ドキュメント
├── projects[] (Project構造体配列)
├── local_settings (LocalSettings構造体)
└── view_settings[] (ViewItem構造体配列)

account.automerge                  # アカウント情報ドキュメント
└── (Account構造体)

user.automerge                     # ユーザー情報ドキュメント
└── (User構造体)

project_{project_id}.automerge     # プロジェクト別ドキュメント
├── project_id (文字列)
├── task_lists[] (TaskList構造体配列)
├── tasks[] (Task構造体配列)
├── subtasks[] (SubTask構造体配列)
├── tags[] (Tag構造体配列)
└── project_members[] (ProjectMember構造体配列)
```

## 階層的データアクセス API設計

### 基本パターン

```rust
// Settings Document アクセス
list_projects() -> Result<Vec<Project>, RepositoryError>
get_local_settings() -> Result<LocalSettings, RepositoryError>
set_local_settings(settings: &LocalSettings) -> Result<(), RepositoryError>

// Account/User Document アクセス
get_account() -> Result<Option<Account>, RepositoryError>
set_account(account: &Account) -> Result<(), RepositoryError>
get_user() -> Result<Option<User>, RepositoryError>
set_user(user: &User) -> Result<(), RepositoryError>

// Project Document アクセス (project_id毎)
// タスクリスト操作
set_task_list(project_id: &str, task_list: &TaskList) -> Result<(), RepositoryError>
get_task_list(project_id: &str, task_list_id: &str) -> Result<Option<TaskList>, RepositoryError>
list_task_lists(project_id: &str) -> Result<Vec<TaskList>, RepositoryError>

// タスク操作
set_task(project_id: &str, task: &Task) -> Result<(), RepositoryError>
get_task(project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError>
list_tasks(project_id: &str) -> Result<Vec<Task>, RepositoryError>

// サブタスク操作
set_subtask(subtask: &SubTask) -> Result<(), RepositoryError>
get_subtask(subtask_id: &str) -> Result<Option<SubTask>, RepositoryError>
list_subtasks(task_id: &str) -> Result<Vec<SubTask>, RepositoryError>

// タグ操作
set_tag(project_id: &str, tag: &Tag) -> Result<(), RepositoryError>
get_tag(project_id: &str, tag_id: &str) -> Result<Option<Tag>, RepositoryError>
list_tags(project_id: &str) -> Result<Vec<Tag>, RepositoryError>

// プロジェクトメンバー操作
set_project_member(project_id: &str, member: &ProjectMember) -> Result<(), RepositoryError>
get_project_member(project_id: &str, user_id: &str) -> Result<Option<ProjectMember>, RepositoryError>
list_project_members(project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError>
```

## エラーハンドリング

### エラー変換フロー

```
Repository Error → Service Error → Facade Error → Command Error → Frontend
```

### 各層の役割

- **RepositoryError**: データアクセスエラー（ストレージ固有）
- **ServiceError**: ドメインビジネスロジックエラー（RepositoryErrorからの自動変換含む）
- **FacadeError**: アプリケーション統合エラー（複数サービス協調時のエラー）
- **CommandError**: UI表示用エラー（SerializationError、入力検証エラー等）

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

- **4ドキュメント分割方式**:
  - **Settings Document**: アプリケーション設定とプロジェクト一覧
  - **Account Document**: 認証アカウント情報（プロバイダー情報、認証状態）
  - **User Document**: ユーザープロフィール情報（個人設定、プロフィール）
  - **Project Documents**: プロジェクト毎の詳細データ（1プロジェクト = 1ドキュメント）

- **Project Document含有データ**:
  - プロジェクト詳細データ
  - 全タスクリスト、全タスク、全サブタスク
  - プロジェクト固有タグ、メンバー情報

- **設計根拠**:
  - **データ一貫性**: プロジェクト内エンティティの整合性を1ドキュメントで保証
  - **トランザクション境界**: プロジェクト内の複数変更を1トランザクションで処理
  - **権限管理**: プロジェクト単位でのアクセス制御が自然
  - **パフォーマンス**: 2層アーキテクチャにより大きなドキュメントも実行時影響軽微
  - **セキュリティ**: アカウント認証情報とユーザー情報を分離管理
  - **設定分離**: グローバル設定とプロジェクト固有データの独立管理
