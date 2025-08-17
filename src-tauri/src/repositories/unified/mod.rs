//! 統合リポジトリのメインエントリーポイント
//!
//! 複数のストレージ（SQLite、Automerge）を統合し、Service層から直感的にアクセスできる
//! Repository構造を提供する。
//!
//! 設計原則:
//! - 検索系操作: SQLite（高速）
//! - 保存系操作: Automerge（永続化） → SQLite（同期）
//! - 統一インターフェース: 全エンティティで一貫したアクセス方法

// 統合リポジトリ群
pub mod account;
pub mod project;
pub mod settings;
pub mod subtask;
pub mod tag;
pub mod task;
pub mod task_list;

// 公開
pub use account::AccountUnifiedRepository;
pub use project::ProjectUnifiedRepository;
pub use settings::SettingsUnifiedRepository;
pub use subtask::SubTaskUnifiedRepository;
pub use tag::TagUnifiedRepository;
pub use task::TaskUnifiedRepository;
pub use task_list::TaskListUnifiedRepository;

pub use super::local_automerge::local_automerge_repositories::LocalAutomergeRepositories;
pub use super::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories;
