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
pub mod subtask;
pub mod settings;
pub mod tag;
pub mod task;
pub mod task_list;

use crate::errors::repository_error::RepositoryError;

// 公開
pub use project::ProjectUnifiedRepository;
pub use task_list::TaskListUnifiedRepository;
pub use task::TaskUnifiedRepository;
pub use subtask::SubTaskUnifiedRepository;
pub use tag::TagUnifiedRepository;
pub use account::AccountUnifiedRepository;
pub use settings::SettingsUnifiedRepository;

pub use super::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories;
pub use super::local_automerge::local_automerge_repositories::LocalAutomergeRepositories;

/// 統合リポジトリのメインエントリーポイント
///
/// 全エンティティへの統一アクセスポイントを提供し、
/// 内部で最適なストレージを自動選択する。
pub struct UnifiedRepositories {
    pub projects: ProjectUnifiedRepository,
    pub task_lists: TaskListUnifiedRepository,
    pub tasks: TaskUnifiedRepository,
    pub sub_tasks: SubTaskUnifiedRepository,
    pub tags: TagUnifiedRepository,
    pub accounts: AccountUnifiedRepository,
    pub settings: SettingsUnifiedRepository,

    // 内部ストレージリポジトリ（各エンティティから参照される）
    sqlite_repositories: LocalSqliteRepositories,
    automerge_repositories: LocalAutomergeRepositories,
}

impl UnifiedRepositories {
    /// 新しい統合リポジトリインスタンスを作成
    pub async fn new() -> Result<Self, RepositoryError> {
        // ストレージリポジトリを初期化
        let sqlite_repositories = LocalSqliteRepositories::new().await?;
        let automerge_repositories = LocalAutomergeRepositories::new().await?;

        Ok(Self {
            projects: ProjectUnifiedRepository::new(),
            task_lists: TaskListUnifiedRepository::new(),
            tasks: TaskUnifiedRepository::new(),
            sub_tasks: SubTaskUnifiedRepository::new(),
            tags: TagUnifiedRepository::new(),
            accounts: AccountUnifiedRepository::new(),
            settings: SettingsUnifiedRepository::new(),
            sqlite_repositories,
            automerge_repositories,
        })
    }

    /// SQLiteリポジトリへの参照を取得（内部使用）
    pub(crate) fn sqlite(&self) -> &LocalSqliteRepositories {
        &self.sqlite_repositories
    }

    /// Automergeリポジトリへの参照を取得（内部使用）
    pub(crate) fn automerge(&self) -> &LocalAutomergeRepositories {
        &self.automerge_repositories
    }
}
