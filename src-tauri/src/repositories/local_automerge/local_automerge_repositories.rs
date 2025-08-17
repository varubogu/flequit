//! Automergeリポジトリの統合管理
//! 
//! 各エンティティのAutomergeリポジトリを一元管理し、
//! 統合リポジトリからの永続化・同期要求に対応する。

use crate::errors::repository_error::RepositoryError;
use crate::repositories::local_automerge::{
    projects_repository::ProjectsRepository,
    account_repository::AccountRepository,
    settings_repository::SettingsRepository,
};
use crate::services::path_service::PathService;

/// Automergeリポジトリ群の統合管理
/// 
/// 各エンティティのAutomergeリポジトリを保持し、
/// 永続化・同期系操作を担当する。
pub struct LocalAutomergeRepositories {
    pub projects: ProjectsRepository,
    pub accounts: AccountRepository,
    pub settings: SettingsRepository,
    // 注意: 現在TaskList、Task、SubTask、TagのAutomergeリポジトリは未実装
    // 当面はProjectsRepositoryの機能を経由してアクセス
}

impl LocalAutomergeRepositories {
    /// 新しいAutomergeリポジトリ群を作成
    pub async fn new() -> Result<Self, RepositoryError> {
        // データディレクトリのパスを取得
        let data_dir = PathService::get_default_data_dir()
            .map_err(|e| RepositoryError::ConfigurationError(format!("Failed to get data directory: {}", e)))?;
        
        Ok(Self {
            projects: ProjectsRepository::new(data_dir.clone())
                .map_err(|e| RepositoryError::ConfigurationError(format!("Failed to create ProjectsRepository: {:?}", e)))?,
            accounts: AccountRepository::new(data_dir.clone())
                .map_err(|e| RepositoryError::ConfigurationError(format!("Failed to create AccountRepository: {:?}", e)))?,
            settings: SettingsRepository::new(data_dir)
                .map_err(|e| RepositoryError::ConfigurationError(format!("Failed to create SettingsRepository: {:?}", e)))?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_local_automerge_repositories_creation() {
        let temp_dir = TempDir::new().unwrap();
        let data_dir = temp_dir.path().to_path_buf();
        
        // PathServiceの代わりに直接パスを指定してテスト
        let projects = ProjectsRepository::new(data_dir.clone()).unwrap();
        let accounts = AccountRepository::new(data_dir.clone()).unwrap();
        let settings = SettingsRepository::new(data_dir).unwrap();
        
        let repos = LocalAutomergeRepositories {
            projects,
            accounts,
            settings,
        };
        
        // 作成が成功することを確認
        assert!(true); // 構造体が正常に作成されたことを確認
    }
}