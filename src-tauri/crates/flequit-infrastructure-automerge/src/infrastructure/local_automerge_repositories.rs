//! Automergeリポジトリの統合管理
//!
//! 各エンティティのAutomergeリポジトリを一元管理し、
//! 統合リポジトリからの保存系要求に対応する。

use crate::errors::automerge_error::AutomergeError;
use crate::infrastructure::{
    accounts::account::AccountLocalAutomergeRepository,
    task_projects::project::ProjectLocalAutomergeRepository,
    app_settings::settings::SettingsLocalAutomergeRepository,
    task_projects::subtask::SubTaskLocalAutomergeRepository,
    task_projects::subtask_assignments::SubtaskAssignmentLocalAutomergeRepository,
    task_projects::subtask_tag::SubtaskTagLocalAutomergeRepository,
    task_projects::tag::TagLocalAutomergeRepository,
    task_projects::task::TaskLocalAutomergeRepository,
    task_projects::task_assignments::TaskAssignmentLocalAutomergeRepository,
    task_projects::task_list::TaskListLocalAutomergeRepository,
    task_projects::task_tag::TaskTagLocalAutomergeRepository,
    users::user::UserLocalAutomergeRepository,
};

/// Automergeリポジトリ群の統合管理
///
/// 各エンティティのAutomergeリポジトリを保持し、
/// 保存系操作の永続化を担当する。
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
    pub settings: SettingsLocalAutomergeRepository,
}

impl LocalAutomergeRepositories {
    /// 新しいAutomergeリポジトリ群を作成
    #[tracing::instrument(level = "trace")]
    pub async fn new(base_path: std::path::PathBuf) -> Result<Self, AutomergeError> {
        Ok(Self {
            projects: ProjectLocalAutomergeRepository::new(base_path.clone()).await?,
            task_lists: TaskListLocalAutomergeRepository::new(base_path.clone()).await?,
            tasks: TaskLocalAutomergeRepository::new(base_path.clone()).await?,
            sub_tasks: SubTaskLocalAutomergeRepository::new(base_path.clone()).await?,
            tags: TagLocalAutomergeRepository::new(base_path.clone()).await?,
            task_tags: TaskTagLocalAutomergeRepository::new(base_path.clone()).await?,
            task_assignments: TaskAssignmentLocalAutomergeRepository::new(base_path.clone()).await?,
            subtask_tags: SubtaskTagLocalAutomergeRepository::new(base_path.clone()).await?,
            subtask_assignments: SubtaskAssignmentLocalAutomergeRepository::new(base_path.clone()).await?,
            accounts: AccountLocalAutomergeRepository::new(base_path.clone()).await?,
            users: UserLocalAutomergeRepository::new(base_path.clone()).await?,
            settings: SettingsLocalAutomergeRepository::new(base_path.clone()).await?,
        })
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
