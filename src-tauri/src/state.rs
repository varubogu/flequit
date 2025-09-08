use std::sync::Arc;
use tokio::sync::RwLock;
use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};

/// アプリケーション全体で共有される状態
#[derive(Clone)]
pub struct AppState<R = InfrastructureRepositories> 
where 
    R: InfrastructureRepositoriesTrait + Send + Sync + 'static 
{
    pub repositories: Arc<RwLock<R>>,
}

impl AppState<InfrastructureRepositories> {
    pub async fn new() -> Result<Self, String> {
        let repositories = InfrastructureRepositories::setup_with_sqlite_and_automerge().await
            .map_err(|e| e.to_string())?;

        Ok(AppState {
            repositories: Arc::new(RwLock::new(repositories)),
        })
    }
}

impl<R> AppState<R>
where
    R: InfrastructureRepositoriesTrait + Send + Sync + 'static
{
    /// 任意のリポジトリ実装でAppStateを作成（主にテスト用）
    pub fn with_repositories(repositories: R) -> Self {
        AppState {
            repositories: Arc::new(RwLock::new(repositories)),
        }
    }
}
