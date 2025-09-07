//! 統合リポジトリのメインエントリーポイント
//!
//! 複数のストレージ（SQLite、Automerge）を統合し、Service層から直感的にアクセスできる
//! Repository構造を提供する。
//!
//! 設計原則:
//! - 検索系操作: SQLite（高速）
//! - 保存系操作: Automerge（永続化） → SQLite（同期）
//! - 統一インターフェース: 全エンティティで一貫したアクセス方法

// 統合リポジトリ群（サブフォルダ単位）
pub mod task_projects;
pub mod accounts;
pub mod app_settings;
pub mod users;

// 将来追加予定のモジュール
// pub mod search;
// pub mod initialized_data;

// 公開エクスポート（既存の互換性維持）
pub use accounts::AccountUnifiedRepository;
pub use app_settings::SettingsUnifiedRepository;
pub use task_projects::{ProjectUnifiedRepository, SubTaskUnifiedRepository, TagUnifiedRepository, TaskUnifiedRepository, TaskListUnifiedRepository, TaskAssignmentUnifiedRepository, SubTaskAssignmentUnifiedRepository};
pub use users::UserUnifiedRepository;

// Infrastructure層リポジトリの再エクスポート
pub use flequit_infrastructure_sqlite::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
pub use flequit_infrastructure_automerge::LocalAutomergeRepositories;