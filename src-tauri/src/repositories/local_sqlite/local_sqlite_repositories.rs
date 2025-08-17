//! SQLiteリポジトリの統合管理
//!
//! 各エンティティのSQLiteリポジトリを一元管理し、
//! 統合リポジトリからの高速検索要求に対応する。

use crate::errors::repository_error::RepositoryError;
use crate::repositories::local_sqlite::{
    project::ProjectLocalSqliteRepository,
    task_list::TaskListLocalSqliteRepository,
    task::TaskLocalSqliteRepository,
    subtask::SubtaskLocalSqliteRepository,
    tag::TagLocalSqliteRepository,
    account::AccountRepository,
    settings::SettingsLocalSqliteRepository,
    DatabaseManager,
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
    pub accounts: AccountRepository,
    pub settings: SettingsLocalSqliteRepository,
}

impl LocalSqliteRepositories {
    /// 新しいSQLiteリポジトリ群を作成
    pub async fn new() -> Result<Self, RepositoryError> {
        // 共通のデータベースマネージャーを作成
        let db_manager = DatabaseManager::with_default_path().await?;

        Ok(Self {
            projects: ProjectLocalSqliteRepository::new(db_manager.clone()),
            task_lists: TaskListLocalSqliteRepository::new(db_manager.clone()),
            tasks: TaskLocalSqliteRepository::new(db_manager.clone()),
            sub_tasks: SubtaskLocalSqliteRepository::new(db_manager.clone()),
            tags: TagLocalSqliteRepository::new(db_manager.clone()),
            accounts: AccountRepository::new(db_manager.clone()),
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
