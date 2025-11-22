//! SQLiteリポジトリの統合管理
//!
//! 各エンティティのSQLiteリポジトリを一元管理し、
//! 統合リポジトリからの高速検索要求に対応する。

use crate::errors::sqlite_error::SQLiteError;
use crate::infrastructure::{
    accounts::account::AccountLocalSqliteRepository, database_manager::DatabaseManager,
    task_projects::project::ProjectLocalSqliteRepository,
    task_projects::subtask::SubTaskLocalSqliteRepository,
    task_projects::subtask_assignments::SubtaskAssignmentLocalSqliteRepository,
    task_projects::subtask_tag::SubtaskTagLocalSqliteRepository,
    task_projects::tag::TagLocalSqliteRepository, task_projects::task::TaskLocalSqliteRepository,
    task_projects::task_assignments::TaskAssignmentLocalSqliteRepository,
    task_projects::task_list::TaskListLocalSqliteRepository,
    task_projects::task_tag::TaskTagLocalSqliteRepository, users::user::UserLocalSqliteRepository,
    user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository,
};

/// SQLiteリポジトリ群の統合管理
///
/// 各エンティティのSQLiteリポジトリを保持し、
/// 検索系操作の高速実行を担当する。
#[derive(Debug)]
pub struct LocalSqliteRepositories {
    pub projects: ProjectLocalSqliteRepository,
    pub task_lists: TaskListLocalSqliteRepository,
    pub tasks: TaskLocalSqliteRepository,
    pub sub_tasks: SubTaskLocalSqliteRepository,
    pub tags: TagLocalSqliteRepository,
    pub task_tags: TaskTagLocalSqliteRepository,
    pub task_assignments: TaskAssignmentLocalSqliteRepository,
    pub subtask_tags: SubtaskTagLocalSqliteRepository,
    pub subtask_assignments: SubtaskAssignmentLocalSqliteRepository,
    pub accounts: AccountLocalSqliteRepository,
    pub users: UserLocalSqliteRepository,
    pub tag_bookmarks: TagBookmarkLocalSqliteRepository,
}

impl LocalSqliteRepositories {
    /// 新しいSQLiteリポジトリ群を作成

    pub async fn new() -> Result<Self, SQLiteError> {
        // シングルトンのデータベースマネージャーを取得
        let db_manager = DatabaseManager::instance().await?;

        Ok(Self {
            projects: ProjectLocalSqliteRepository::new(db_manager.clone()),
            task_lists: TaskListLocalSqliteRepository::new(db_manager.clone()),
            tasks: TaskLocalSqliteRepository::new(db_manager.clone()),
            sub_tasks: SubTaskLocalSqliteRepository::new(db_manager.clone()),
            tags: TagLocalSqliteRepository::new(db_manager.clone()),
            task_tags: TaskTagLocalSqliteRepository::new(db_manager.clone()),
            task_assignments: TaskAssignmentLocalSqliteRepository::new(db_manager.clone()),
            subtask_tags: SubtaskTagLocalSqliteRepository::new(db_manager.clone()),
            subtask_assignments: SubtaskAssignmentLocalSqliteRepository::new(db_manager.clone()),
            accounts: AccountLocalSqliteRepository::new(db_manager.clone()),
            users: UserLocalSqliteRepository::new(db_manager.clone()),
            tag_bookmarks: TagBookmarkLocalSqliteRepository::new(db_manager),
        })
    }

    /// デフォルト設定でリポジトリ群を設定

    pub async fn setup() -> Result<Self, Box<dyn std::error::Error>> {
        Self::new().await.map_err(|e| e.into())
    }

    /// プロジェクトリポジトリへのアクセス
    pub fn projects(&self) -> &ProjectLocalSqliteRepository {
        &self.projects
    }

    /// アカウントリポジトリへのアクセス
    pub fn accounts(&self) -> &AccountLocalSqliteRepository {
        &self.accounts
    }

    /// タスクリポジトリへのアクセス
    pub fn tasks(&self) -> &TaskLocalSqliteRepository {
        &self.tasks
    }

    /// サブタスクリポジトリへのアクセス
    pub fn sub_tasks(&self) -> &SubTaskLocalSqliteRepository {
        &self.sub_tasks
    }

    /// タグリポジトリへのアクセス
    pub fn tags(&self) -> &TagLocalSqliteRepository {
        &self.tags
    }

    /// タスクリストリポジトリへのアクセス
    pub fn task_lists(&self) -> &TaskListLocalSqliteRepository {
        &self.task_lists
    }

    /// ユーザーリポジトリへのアクセス
    pub fn users(&self) -> &UserLocalSqliteRepository {
        &self.users
    }

    /// タスクアサインリポジトリへのアクセス
    pub fn task_assignments(&self) -> &TaskAssignmentLocalSqliteRepository {
        &self.task_assignments
    }

    /// サブタスクアサインリポジトリへのアクセス
    pub fn subtask_assignments(&self) -> &SubtaskAssignmentLocalSqliteRepository {
        &self.subtask_assignments
    }

    /// タグブックマークリポジトリへのアクセス
    pub fn tag_bookmarks(&self) -> &TagBookmarkLocalSqliteRepository {
        &self.tag_bookmarks
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
