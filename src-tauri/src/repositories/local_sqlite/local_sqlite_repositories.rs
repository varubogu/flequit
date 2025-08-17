//! SQLiteリポジトリの統合管理
//! 
//! 各エンティティのSQLiteリポジトリを一元管理し、
//! 統合リポジトリからの高速検索要求に対応する。

use crate::errors::repository_error::RepositoryError;
use crate::repositories::local_sqlite::{
    project_repository::ProjectRepository,
    task_list_repository::TaskListRepository,
    task_repository::TaskRepository,
    subtask_repository::SubtaskRepository,
    tag_repository::TagRepository,
    account_repository::AccountRepository,
    settings_repository::SettingsRepository,
    DatabaseManager,
};

/// SQLiteリポジトリ群の統合管理
/// 
/// 各エンティティのSQLiteリポジトリを保持し、
/// 検索系操作の高速実行を担当する。
pub struct LocalSqliteRepositories {
    pub projects: ProjectRepository,
    pub task_lists: TaskListRepository,
    pub tasks: TaskRepository,
    pub sub_tasks: SubtaskRepository,
    pub tags: TagRepository,
    pub accounts: AccountRepository,
    pub settings: SettingsRepository,
}

impl LocalSqliteRepositories {
    /// 新しいSQLiteリポジトリ群を作成
    pub async fn new() -> Result<Self, RepositoryError> {
        // 共通のデータベースマネージャーを作成
        let db_manager = DatabaseManager::with_default_path().await?;
        
        Ok(Self {
            projects: ProjectRepository::new(db_manager.clone()),
            task_lists: TaskListRepository::new(db_manager.clone()),
            tasks: TaskRepository::new(db_manager.clone()),
            sub_tasks: SubtaskRepository::new(db_manager.clone()),
            tags: TagRepository::new(db_manager.clone()),
            accounts: AccountRepository::new(db_manager.clone()),
            settings: SettingsRepository::new(db_manager),
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