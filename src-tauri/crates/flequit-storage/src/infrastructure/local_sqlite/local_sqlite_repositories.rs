//! SQLiteリポジトリの統合管理
//!
//! 各エンティティのSQLiteリポジトリを一元管理し、
//! 統合リポジトリからの高速検索要求に対応する。

use crate::errors::repository_error::RepositoryError;
use crate::infrastructure::local_sqlite::{
    account::AccountLocalSqliteRepository, database_manager::DatabaseManager,
    project::ProjectLocalSqliteRepository, settings::SettingsLocalSqliteRepository,
    subtask::SubtaskLocalSqliteRepository, subtask_assignments::SubtaskAssignmentLocalSqliteRepository,
    subtask_tag::SubtaskTagLocalSqliteRepository, tag::TagLocalSqliteRepository,
    task::TaskLocalSqliteRepository, task_assignments::TaskAssignmentLocalSqliteRepository,
    task_list::TaskListLocalSqliteRepository, task_tag::TaskTagLocalSqliteRepository,
};

/// SQLiteリポジトリ群の統合管理
///
/// 各エンティティのSQLiteリポジトリを保持し、
/// 検索系操作の高速実行を担当する。
pub struct LocalSqliteRepositories {
    pub projects: ProjectLocalSqliteRepository,
    pub task_lists: TaskListLocalSqliteRepository,
    pub tasks: TaskLocalSqliteRepository,
    pub sub_tasks: SubtaskLocalSqliteRepository,
    pub tags: TagLocalSqliteRepository,
    pub task_tags: TaskTagLocalSqliteRepository,
    pub task_assignments: TaskAssignmentLocalSqliteRepository,
    pub subtask_tags: SubtaskTagLocalSqliteRepository,
    pub subtask_assignments: SubtaskAssignmentLocalSqliteRepository,
    pub accounts: AccountLocalSqliteRepository,
    pub settings: SettingsLocalSqliteRepository,
}

impl LocalSqliteRepositories {
    /// 新しいSQLiteリポジトリ群を作成
    #[tracing::instrument(level = "trace")]
    pub async fn new() -> Result<Self, RepositoryError> {
        // シングルトンのデータベースマネージャーを取得
        let db_manager = DatabaseManager::instance().await?;

        Ok(Self {
            projects: ProjectLocalSqliteRepository::new(db_manager.clone()),
            task_lists: TaskListLocalSqliteRepository::new(db_manager.clone()),
            tasks: TaskLocalSqliteRepository::new(db_manager.clone()),
            sub_tasks: SubtaskLocalSqliteRepository::new(db_manager.clone()),
            tags: TagLocalSqliteRepository::new(db_manager.clone()),
            task_tags: TaskTagLocalSqliteRepository::new(db_manager.clone()),
            task_assignments: TaskAssignmentLocalSqliteRepository::new(db_manager.clone()),
            subtask_tags: SubtaskTagLocalSqliteRepository::new(db_manager.clone()),
            subtask_assignments: SubtaskAssignmentLocalSqliteRepository::new(db_manager.clone()),
            accounts: AccountLocalSqliteRepository::new(db_manager.clone()),
            settings: SettingsLocalSqliteRepository::new(db_manager),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_local_sqlite_repositories_creation() {
        let repos = LocalSqliteRepositories::new().await;
        assert!(repos.is_ok());
    }
}
