use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::accounts::account::Account;
use flequit_model::models::task_projects::project::ProjectTree;
use flequit_model::models::app_settings::settings::Settings;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use crate::services::initialization_service;

/// ドメインレベルでの初期化データを表現する構造体
#[derive(Debug, Clone)]
pub struct InitializationData {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<ProjectTree>,
}

// エラー変換のヘルパー関数
fn handle_service_error<T>(result: Result<T, ServiceError>) -> Result<T, String> {
    result.map_err(|e| format!("{:?}", e))
}

// TODO: この関数はジェネリクス対応が必要だが、コマンドでは使用されていないためコメントアウト
// #[tracing::instrument]
// pub async fn load_all_data() -> Result<InitializationData, String> {
//     // 他の関数を組み合わせて全データを取得
//     let settings_opt = load_local_settings().await?;
//     let settings = settings_opt.unwrap_or_default(); // デフォルト設定を使用
//     let _current_account = load_current_account().await?; // 現在は使用しない
//     let projects = load_all_project_trees().await?;
//     let accounts = load_all_account().await?;
// 
//     Ok(InitializationData {
//         settings,
//         accounts,
//         projects,
//     })
// }

#[tracing::instrument]
pub async fn load_local_settings<R>(repositories: &R) -> Result<Option<Settings>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(initialization_service::load_local_settings(repositories).await)
}

#[tracing::instrument]
pub async fn load_current_account<R>(repositories: &R) -> Result<Option<Account>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(initialization_service::load_current_account(repositories).await)
}

#[tracing::instrument]
pub async fn load_all_project_trees<R>(repositories: &R) -> Result<Vec<ProjectTree>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(initialization_service::load_all_project_trees(repositories).await)
}

#[tracing::instrument]
pub async fn load_all_account<R>(repositories: &R) -> Result<Vec<Account>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    handle_service_error(initialization_service::load_all_account(repositories).await)
}
