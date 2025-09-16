//! 統合リポジトリのメインエントリーポイント
//!
//! 複数のストレージ（SQLite、Automerge）を統合し、Service層から直感的にアクセスできる
//! Repository構造を提供する。
//!
//! 設計原則:
//! - 検索系操作: SQLite（高速）
//! - 保存系操作: Automerge（永続化） → SQLite（同期）
//! - 統一インターフェース: 全エンティティで一貫したアクセス方法

// 設定・管理モジュール
pub mod manager;

// 設定の型エイリアス（後方互換性のため）
pub use crate::config::InfrastructureConfig as UnifiedConfig;

// 統合リポジトリ群（サブフォルダ単位）
pub mod accounts;
pub mod task_projects;
pub mod users;

// 将来追加予定のモジュール
// pub mod search;
// pub mod initialized_data;

// 設定・管理の公開エクスポート
pub use manager::UnifiedManager;

// 公開エクスポート（既存の互換性維持）
pub use accounts::AccountUnifiedRepository;
pub use task_projects::{
    ProjectUnifiedRepository, RecurrenceRuleUnifiedRepository, SubTaskAssignmentUnifiedRepository,
    SubTaskTagUnifiedRepository, SubTaskUnifiedRepository, TagUnifiedRepository,
    TaskAssignmentUnifiedRepository, TaskListUnifiedRepository, TaskTagUnifiedRepository,
    TaskUnifiedRepository,
};
pub use users::UserUnifiedRepository;

// Infrastructure層リポジトリの再エクスポート
pub use flequit_infrastructure_automerge::LocalAutomergeRepositories;
pub use flequit_infrastructure_sqlite::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
