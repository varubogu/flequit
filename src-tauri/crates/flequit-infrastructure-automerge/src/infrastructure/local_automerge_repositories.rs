//! Automergeリポジトリの統合管理
//!
//! 各エンティティのAutomergeリポジトリを一元管理し、
//! 統合リポジトリからの保存系要求に対応する。

use crate::errors::automerge_error::AutomergeError;
use crate::infrastructure::{
    accounts::account::AccountLocalAutomergeRepository, document_manager::DocumentManager,
    task_projects::project::ProjectLocalAutomergeRepository,
    task_projects::subtask::SubTaskLocalAutomergeRepository,
    task_projects::subtask_assignments::SubtaskAssignmentLocalAutomergeRepository,
    task_projects::subtask_tag::SubtaskTagLocalAutomergeRepository,
    task_projects::tag::TagLocalAutomergeRepository,
    task_projects::task::TaskLocalAutomergeRepository,
    task_projects::task_assignments::TaskAssignmentLocalAutomergeRepository,
    task_projects::task_list::TaskListLocalAutomergeRepository,
    task_projects::task_tag::TaskTagLocalAutomergeRepository,
    users::user::UserLocalAutomergeRepository,
    user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository,
};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automergeリポジトリ群の統合管理
///
/// 各エンティティのAutomergeリポジトリを保持し、
/// 保存系操作の永続化を担当する。
#[derive(Debug)]
pub struct LocalAutomergeRepositories {
    pub projects: ProjectLocalAutomergeRepository,
    pub task_lists: TaskListLocalAutomergeRepository,
    pub tasks: TaskLocalAutomergeRepository,
    pub sub_tasks: SubTaskLocalAutomergeRepository,
    pub tags: TagLocalAutomergeRepository,
    pub task_tags: TaskTagLocalAutomergeRepository,
    pub task_assignments: TaskAssignmentLocalAutomergeRepository,
    pub subtask_tags: SubtaskTagLocalAutomergeRepository,
    pub subtask_assignments: SubtaskAssignmentLocalAutomergeRepository,
    pub accounts: AccountLocalAutomergeRepository,
    pub users: UserLocalAutomergeRepository,
    pub tag_bookmarks: TagBookmarkLocalAutomergeRepository,
}

impl LocalAutomergeRepositories {
    /// 新しいAutomergeリポジトリ群を作成
    pub async fn new(base_path: std::path::PathBuf) -> Result<Self, AutomergeError> {
        Ok(Self {
            projects: ProjectLocalAutomergeRepository::new(base_path.clone()).await?,
            task_lists: TaskListLocalAutomergeRepository::new(base_path.clone()).await?,
            tasks: TaskLocalAutomergeRepository::new(base_path.clone()).await?,
            sub_tasks: SubTaskLocalAutomergeRepository::new(base_path.clone()).await?,
            tags: TagLocalAutomergeRepository::new(base_path.clone()).await?,
            task_tags: TaskTagLocalAutomergeRepository::new(base_path.clone()).await?,
            task_assignments: TaskAssignmentLocalAutomergeRepository::new(base_path.clone())
                .await?,
            subtask_tags: SubtaskTagLocalAutomergeRepository::new(base_path.clone()).await?,
            subtask_assignments: SubtaskAssignmentLocalAutomergeRepository::new(base_path.clone())
                .await?,
            accounts: AccountLocalAutomergeRepository::new(base_path.clone()).await?,
            users: UserLocalAutomergeRepository::new(base_path.clone()).await?,
            tag_bookmarks: TagBookmarkLocalAutomergeRepository::new(base_path).await?,
        })
    }

    /// デフォルト設定でリポジトリ群を設定
    pub async fn setup() -> Result<Self, Box<dyn std::error::Error>> {
        // デフォルトのベースパスを使用
        let base_path = std::env::temp_dir().join("flequit_automerge");
        Self::new(base_path).await.map_err(|e| e.into())
    }

    /// 共有DocumentManagerを使用してリポジトリ群を設定
    pub async fn setup_with_shared_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            projects: ProjectLocalAutomergeRepository::new_with_manager(document_manager.clone())
                .await?,
            task_lists: TaskListLocalAutomergeRepository::new_with_manager(
                document_manager.clone(),
            )
            .await?,
            tasks: TaskLocalAutomergeRepository::new_with_manager(document_manager.clone()).await?,
            sub_tasks: SubTaskLocalAutomergeRepository::new_with_manager(document_manager.clone())
                .await?,
            tags: TagLocalAutomergeRepository::new_with_manager(document_manager.clone()).await?,
            task_tags: TaskTagLocalAutomergeRepository::new_with_manager(document_manager.clone())
                .await?,
            task_assignments: TaskAssignmentLocalAutomergeRepository::new_with_manager(
                document_manager.clone(),
            )
            .await?,
            subtask_tags: SubtaskTagLocalAutomergeRepository::new_with_manager(
                document_manager.clone(),
            )
            .await?,
            subtask_assignments: SubtaskAssignmentLocalAutomergeRepository::new_with_manager(
                document_manager.clone(),
            )
            .await?,
            accounts: AccountLocalAutomergeRepository::new_with_manager(document_manager.clone())
                .await?,
            users: UserLocalAutomergeRepository::new_with_manager(document_manager.clone()).await?,
            tag_bookmarks: TagBookmarkLocalAutomergeRepository::new_with_manager(document_manager).await?,
        })
    }

    /// プロジェクトリポジトリへのアクセス
    pub fn projects(&self) -> &ProjectLocalAutomergeRepository {
        &self.projects
    }

    /// アカウントリポジトリへのアクセス
    pub fn accounts(&self) -> &AccountLocalAutomergeRepository {
        &self.accounts
    }

    /// タスクリポジトリへのアクセス
    pub fn tasks(&self) -> &TaskLocalAutomergeRepository {
        &self.tasks
    }

    /// サブタスクリポジトリへのアクセス
    pub fn sub_tasks(&self) -> &SubTaskLocalAutomergeRepository {
        &self.sub_tasks
    }

    /// タグリポジトリへのアクセス
    pub fn tags(&self) -> &TagLocalAutomergeRepository {
        &self.tags
    }

    /// タスクリストリポジトリへのアクセス
    pub fn task_lists(&self) -> &TaskListLocalAutomergeRepository {
        &self.task_lists
    }

    /// ユーザーリポジトリへのアクセス
    pub fn users(&self) -> &UserLocalAutomergeRepository {
        &self.users
    }

    /// タスクアサインリポジトリへのアクセス
    pub fn task_assignments(&self) -> &TaskAssignmentLocalAutomergeRepository {
        &self.task_assignments
    }

    /// サブタスクアサインリポジトリへのアクセス
    pub fn subtask_assignments(&self) -> &SubtaskAssignmentLocalAutomergeRepository {
        &self.subtask_assignments
    }

    /// タグブックマークリポジトリへのアクセス
    pub fn tag_bookmarks(&self) -> &TagBookmarkLocalAutomergeRepository {
        &self.tag_bookmarks
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_local_automerge_repositories_creation() {
        let temp_dir = std::env::temp_dir().join("flequit_test_automerge");
        let repos = LocalAutomergeRepositories::new(temp_dir).await;
        assert!(repos.is_ok());
    }
}
