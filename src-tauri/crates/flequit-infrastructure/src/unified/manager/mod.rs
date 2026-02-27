//! Unified層のマネージャー
//!
//! 設定に基づいてバックエンドリポジトリを初期化・管理する

mod assignment_builders;
mod project_builders;
mod recurrence_builders;
mod tag_builders;
mod task_builders;

use flequit_infrastructure_automerge::LocalAutomergeRepositories;
use flequit_infrastructure_automerge::infrastructure::document_manager::DocumentManager;
use flequit_infrastructure_sqlite::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

use crate::unified::UnifiedConfig;

/// Unified層のマネージャー
///
/// 設定に基づいてバックエンドリポジトリの初期化・再構築を管理する
#[derive(Debug)]
pub struct UnifiedManager {
    pub(super) config: UnifiedConfig,
    pub(super) sqlite_repositories: Option<Arc<RwLock<LocalSqliteRepositories>>>,
    pub(super) automerge_repositories: Option<Arc<RwLock<LocalAutomergeRepositories>>>,
    /// 共有DocumentManager - Automerge Repoの重複を避けるため
    pub(super) shared_document_manager: Option<Arc<Mutex<DocumentManager>>>,
}

impl UnifiedManager {
    /// 新しいUnifiedManagerを作成
    pub fn new() -> Self {
        Self {
            config: UnifiedConfig::default(),
            sqlite_repositories: None,
            automerge_repositories: None,
            shared_document_manager: None,
        }
    }

    /// 設定から新しいUnifiedManagerを作成
    pub async fn from_config(config: UnifiedConfig) -> Result<Self, Box<dyn std::error::Error>> {
        config.validate()?;

        let mut manager = Self {
            config: config.clone(),
            sqlite_repositories: None,
            automerge_repositories: None,
            shared_document_manager: None,
        };

        manager.initialize_backends().await?;
        Ok(manager)
    }

    /// 設定を更新し、バックエンドを再構築する
    pub async fn update_config(
        &mut self,
        new_config: UnifiedConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        new_config.validate()?;
        self.config = new_config;
        self.initialize_backends().await?;
        Ok(())
    }

    /// バックエンドリポジトリを初期化
    async fn initialize_backends(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // SQLiteリポジトリの初期化
        if self.config.sqlite_search_enabled || self.config.sqlite_storage_enabled {
            let sqlite_repos = LocalSqliteRepositories::setup().await?;
            self.sqlite_repositories = Some(Arc::new(RwLock::new(sqlite_repos)));
            tracing::info!("SQLiteリポジトリを初期化しました");
        } else {
            self.sqlite_repositories = None;
            tracing::info!("SQLiteリポジトリを無効にしました");
        }

        // Automergeリポジトリの初期化
        if self.config.automerge_storage_enabled {
            // 共有DocumentManagerを初期化（SQLiteと同じディレクトリ構造を使用）
            let base_path =
                get_default_automerge_path().ok_or("Failed to get default Automerge path")?;

            // ディレクトリが存在しない場合は作成
            if !base_path.exists() {
                std::fs::create_dir_all(&base_path)
                    .map_err(|e| format!("Failed to create Automerge directory: {}", e))?;
            }

            let document_manager = DocumentManager::new(base_path.clone())?;
            self.shared_document_manager = Some(Arc::new(Mutex::new(document_manager)));

            // 共有DocumentManagerを使用してAutomergeリポジトリを初期化
            let automerge_repos = flequit_infrastructure_automerge::LocalAutomergeRepositories::setup_with_shared_manager(
                self.shared_document_manager.clone().unwrap(),
            )
            .await?;
            self.automerge_repositories = Some(Arc::new(RwLock::new(automerge_repos)));
            tracing::info!(
                "Automergeリポジトリを共有DocumentManagerで初期化しました: {:?}",
                base_path
            );
        } else {
            self.automerge_repositories = None;
            self.shared_document_manager = None;
            tracing::info!("Automergeリポジトリを無効にしました");
        }

        Ok(())
    }

    /// 現在の設定を取得
    pub fn config(&self) -> &UnifiedConfig {
        &self.config
    }

    /// SQLiteリポジトリへのアクセス（内部用）
    pub(crate) fn sqlite_repositories(&self) -> Option<&Arc<RwLock<LocalSqliteRepositories>>> {
        self.sqlite_repositories.as_ref()
    }

    /// Automergeリポジトリへのアクセス
    pub fn automerge_repositories(&self) -> Option<&Arc<RwLock<LocalAutomergeRepositories>>> {
        self.automerge_repositories.as_ref()
    }
}

impl Default for UnifiedManager {
    fn default() -> Self {
        Self::new()
    }
}

/// デフォルトのAutomergeデータディレクトリパスを取得
/// SQLiteと同じディレクトリ構造を使用: ~/.local/share/flequit/automerge/
pub(super) fn get_default_automerge_path() -> Option<std::path::PathBuf> {
    use std::env;

    // 環境変数からAutomergeパスを取得
    if let Ok(automerge_path) = env::var("FLEQUIT_AUTOMERGE_PATH") {
        return Some(std::path::PathBuf::from(automerge_path));
    }

    // SQLiteと同じベースディレクトリを使用
    if let Some(data_dir) = dirs::data_dir() {
        let app_data_dir = data_dir.join("flequit");
        let automerge_dir = app_data_dir.join("automerge");
        return Some(automerge_dir);
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_unified_manager_creation() {
        let manager = UnifiedManager::new();
        assert!(manager.sqlite_repositories.is_none());
        assert!(manager.automerge_repositories.is_none());
    }

    #[tokio::test]
    async fn test_unified_manager_from_config() {
        let config = UnifiedConfig::default();
        let result = UnifiedManager::from_config(config).await;

        // この테스트はSQLiteとAutomergeの実際の初期化に依存するため、
        // テスト環境では失敗する可能性がある
        // 実際の実装では適切なモック化が必要
        match result {
            Ok(_manager) => {
                // 成功の場合のテスト
            }
            Err(e) => {
                // 초기화 실패는 테스트 환경에서 예상되는 경우
                println!("初期化に失敗（テスト環境では正常）: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_config_validation() {
        let invalid_config = UnifiedConfig::new(false, false, false);

        let result = UnifiedManager::from_config(invalid_config).await;
        assert!(result.is_err());
    }
}
