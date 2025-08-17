//! Automergeリポジトリの統合管理
//!
//! 各エンティティのAutomergeリポジトリを一元管理し、
//! 統合リポジトリからの永続化・同期要求に対応する。

use crate::errors::repository_error::RepositoryError;
use crate::repositories::local_automerge::{
    account::AccountLocalAutomergeRepository, project::ProjectLocalAutomergeRepository,
    settings::SettingsLocalAutomergeRepository,
};
use crate::services::path_service::PathService;

/// Automergeリポジトリ群の統合管理
///
/// 各エンティティのAutomergeリポジトリを保持し、
/// 永続化・同期系操作を担当する。
pub struct LocalAutomergeRepositories {
    pub projects: ProjectLocalAutomergeRepository,
    pub accounts: AccountLocalAutomergeRepository,
    pub settings: SettingsLocalAutomergeRepository,
    // 注意: 現在TaskList、Task、SubTask、TagのAutomergeリポジトリは未実装
    // 当面はProjectsRepositoryの機能を経由してアクセス
}

impl LocalAutomergeRepositories {
    /// 新しいAutomergeリポジトリ群を作成
    pub async fn new() -> Result<Self, RepositoryError> {
        // データディレクトリのパスを取得
        let data_dir = PathService::get_default_data_dir().map_err(|e| {
            RepositoryError::ConfigurationError(format!("Failed to get data directory: {}", e))
        })?;

        Ok(Self {
            projects: ProjectLocalAutomergeRepository::new(),
            accounts: AccountLocalAutomergeRepository::new(data_dir.clone()).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create AccountRepository: {:?}",
                    e
                ))
            })?,
            settings: SettingsLocalAutomergeRepository::new(data_dir).map_err(|e| {
                RepositoryError::ConfigurationError(format!(
                    "Failed to create SettingsRepository: {:?}",
                    e
                ))
            })?,
        })
    }
}
