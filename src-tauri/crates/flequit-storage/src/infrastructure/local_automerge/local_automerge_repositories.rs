//! Automergeリポジトリの統合管理
//!
//! 各エンティティのAutomergeリポジトリを一元管理し、
//! 統合リポジトリからの永続化・同期要求に対応する。

use crate::errors::repository_error::RepositoryError;
use crate::infrastructure::local_automerge::{
    account::AccountLocalAutomergeRepository, project::ProjectLocalAutomergeRepository,
    settings::SettingsLocalAutomergeRepository, subtask::SubTaskLocalAutomergeRepository,
    tag::TagLocalAutomergeRepository, task::TaskLocalAutomergeRepository,
    task_list::TaskListLocalAutomergeRepository, document_manager::DocumentManager,
};
use crate::utils::path_service::PathService;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automergeリポジトリ群の統合管理
///
/// 各エンティティのAutomergeリポジトリを保持し、
/// 永続化・同期系操作を担当する。
pub struct LocalAutomergeRepositories {
    pub projects: ProjectLocalAutomergeRepository,
    pub accounts: AccountLocalAutomergeRepository,
    pub settings: SettingsLocalAutomergeRepository,
    pub task_lists: TaskListLocalAutomergeRepository,
    pub tasks: TaskLocalAutomergeRepository,
    pub sub_tasks: SubTaskLocalAutomergeRepository,
    pub tags: TagLocalAutomergeRepository,
}

impl LocalAutomergeRepositories {
    /// 新しいAutomergeリポジトリ群を作成
    #[tracing::instrument(level = "trace")]
    pub async fn new() -> Result<Self, RepositoryError> {
        // データディレクトリのパスを取得
        let data_dir = PathService::get_default_data_dir().map_err(|e| {
            RepositoryError::ConfigurationError(format!("Failed to get data directory: {}", e))
        })?;

        // 1つのDocumentManagerを作成して全リポジトリで共有
        let document_manager = Arc::new(Mutex::new(
            DocumentManager::new(data_dir.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create shared DocumentManager: {:?}",
                    e
                ))
            })?
        ));

        Ok(Self {
            projects: ProjectLocalAutomergeRepository::new_with_manager(document_manager.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create ProjectRepository: {:?}",
                    e
                ))
            })?,
            accounts: AccountLocalAutomergeRepository::new_with_manager(document_manager.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create AccountRepository: {:?}",
                    e
                ))
            })?,
            settings: SettingsLocalAutomergeRepository::new_with_manager(document_manager.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create SettingsRepository: {:?}",
                    e
                ))
            })?,
            task_lists: TaskListLocalAutomergeRepository::new_with_manager(document_manager.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create TaskListRepository: {:?}",
                    e
                ))
            })?,
            tasks: TaskLocalAutomergeRepository::new_with_manager(document_manager.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create TaskRepository: {:?}",
                    e
                ))
            })?,
            sub_tasks: SubTaskLocalAutomergeRepository::new_with_manager(document_manager.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create SubTaskRepository: {:?}",
                    e
                ))
            })?,
            tags: TagLocalAutomergeRepository::new_with_manager(document_manager).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create TagRepository: {:?}",
                    e
                ))
            })?,
        })
    }
}
