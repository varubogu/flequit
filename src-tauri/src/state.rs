use std::sync::Arc;
use flequit_settings::{SettingsManager, Settings};
use tokio::sync::RwLock;
use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait, InfrastructureConfig};

/// アプリケーション全体で共有される状態
#[derive(Clone, Debug)]
pub struct AppState<R = InfrastructureRepositories>
where
    R: InfrastructureRepositoriesTrait + Send + Sync + 'static
{
    pub repositories: Arc<RwLock<R>>,
    pub settings: Arc<RwLock<Settings>>,
    pub settings_manager: Arc<SettingsManager>,
}

impl AppState<InfrastructureRepositories> {
    pub async fn new() -> Result<Self, String> {
        // 設定マネージャーを初期化
        let settings_manager = SettingsManager::new().map_err(|e| e.to_string())?;

        // 設定を読み込み
        let settings = settings_manager.load_settings().await.map_err(|e| e.to_string())?;

        let repository_config = InfrastructureConfig {
            sqlite_search_enabled: true,
            sqlite_storage_enabled: true,
            automerge_storage_enabled: true,
        };

        let repositories = InfrastructureRepositories::setup_with_sqlite_and_automerge(repository_config).await
            .map_err(|e| e.to_string())?;

        Ok(AppState {
            repositories: Arc::new(RwLock::new(repositories)),
            settings: Arc::new(RwLock::new(settings)),
            settings_manager: Arc::new(settings_manager),
        })
    }
}

impl<R> AppState<R>
where
    R: InfrastructureRepositoriesTrait + Send + Sync + 'static
{
    /// 任意のリポジトリ実装でAppStateを作成（主にテスト用）
    pub fn with_repositories(repositories: R) -> Self {
        // テスト用のデフォルト設定を作成
        let settings_manager = SettingsManager::default();
        let settings = Settings::default();

        AppState {
            repositories: Arc::new(RwLock::new(repositories)),
            settings: Arc::new(RwLock::new(settings)),
            settings_manager: Arc::new(settings_manager),
        }
    }
}
