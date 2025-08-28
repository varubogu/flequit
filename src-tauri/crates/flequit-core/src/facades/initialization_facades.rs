use crate::errors::service_error::ServiceError;
use flequit_model::models::account::Account;
use flequit_model::models::project::ProjectTree;
use flequit_model::models::setting::{LocalSettings, Settings};
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

#[tracing::instrument]
pub async fn load_all_data() -> Result<InitializationData, String> {
    // 他の関数を組み合わせて全データを取得
    let local_settings = load_local_settings().await?;
    let _current_account = load_current_account().await?; // 現在は使用しない
    let projects = load_all_project_trees().await?;
    let accounts = load_all_account().await?;

    // LocalSettingsからSettingsを構築（一時的にLocalSettingsと同じ構造とする）
    let settings = Settings {
        theme: local_settings
            .as_ref()
            .map_or("system".to_string(), |s| s.theme.clone()),
        language: local_settings
            .as_ref()
            .map_or("ja".to_string(), |s| s.language.clone()),
        ..Default::default()
    };

    Ok(InitializationData {
        settings,
        accounts,
        projects,
    })
}

#[tracing::instrument]
pub async fn load_local_settings() -> Result<Option<LocalSettings>, String> {
    handle_service_error(initialization_service::load_local_settings().await)
}

#[tracing::instrument]
pub async fn load_current_account() -> Result<Option<Account>, String> {
    handle_service_error(initialization_service::load_current_account().await)
}

#[tracing::instrument]
pub async fn load_all_project_trees() -> Result<Vec<ProjectTree>, String> {
    handle_service_error(initialization_service::load_all_project_trees().await)
}

#[tracing::instrument]
pub async fn load_all_account() -> Result<Vec<Account>, String> {
    handle_service_error(initialization_service::load_all_account().await)
}
