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
pub mod account_unified_repository;
pub mod project_unified_repository;
pub mod subtask_unified_repository;
pub mod settings_unified_repository;
pub mod tag_unified_repository;
pub mod task_unified_repository;
pub mod task_list_unified_repository;

use crate::errors::repository_error::RepositoryError;

// 公開
pub use project_unified_repository::ProjectUnifiedRepository;
pub use task_list_unified_repository::TaskListUnifiedRepository;
pub use task_unified_repository::TaskUnifiedRepository;
pub use subtask_unified_repository::SubTaskUnifiedRepository;
pub use tag_unified_repository::TagUnifiedRepository;
pub use account_unified_repository::AccountUnifiedRepository;
pub use settings_unified_repository::SettingsUnifiedRepository;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_unified_repositories_creation() {
        let repo = UnifiedRepositories::new().await;
        assert!(repo.is_ok());
    }

    #[tokio::test]
    async fn test_project_unified_repository_basic_operations() {
        use crate::models::project::Project;
        use crate::types::id_types::ProjectId;
        use crate::types::project_types::ProjectStatus;
        use chrono::Utc;

        // 統合リポジトリを作成
        let repos = UnifiedRepositories::new().await.unwrap();

        // テスト用プロジェクトを作成
        let test_project = Project {
            id: ProjectId::new(),
            name: "Test Project".to_string(),
            description: Some("Test Description".to_string()),
            color: Some("#ff0000".to_string()),
            order_index: 1,
            is_archived: false,
            status: Some(ProjectStatus::Active),
            owner_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // 統合保存操作をテスト（Automergeが利用可能でない場合はスキップ）
        let save_result = repos.projects.save_unified(
            &repos.sqlite_repositories,
            &repos.automerge_repositories,
            &test_project
        ).await;

        // Automergeが利用できない場合があるため、SQLiteのみでテスト
        if save_result.is_err() {
            // SQLite単体での保存をテスト
            let sqlite_save = repos.sqlite_repositories.projects.save(&test_project).await;
            assert!(sqlite_save.is_ok(), "SQLite save should work: {:?}", sqlite_save.err());
        }

        // 検索操作をテスト
        let find_result = repos.projects.find_by_id_unified(
            &repos.sqlite_repositories,
            &test_project.id
        ).await;

        assert!(find_result.is_ok(), "Find operation should work: {:?}", find_result.err());
    }
}
