use crate::errors::service_error::ServiceError;
use crate::models::account::Account;
use crate::models::project::Project;
use crate::models::setting::LocalSettings;
use crate::models::command::initialize::InitializedResult;
use crate::services::initialization_service;

// エラー変換のヘルパー関数
fn handle_service_error<T>(result: Result<T, ServiceError>) -> Result<T, String> {
    result.map_err(|e| format!("{:?}", e))
}

pub async fn load_all_data() -> Result<InitializedResult, String> {
    // 他の関数を組み合わせて全データを取得
    let local_settings = load_local_settings().await?;
    let _current_account = load_current_account().await?; // 現在は使用しない
    let projects = load_all_project_data().await?;
    let accounts = load_all_account().await?;
    
    // LocalSettingsからSettingsを構築（一時的にLocalSettingsと同じ構造とする）
    let settings = crate::models::setting::Settings {
        theme: local_settings.as_ref().map_or("system".to_string(), |s| s.theme.clone()),
        language: local_settings.as_ref().map_or("ja".to_string(), |s| s.language.clone()),
        ..Default::default()
    };
    
    Ok(InitializedResult {
        settings,
        accounts,
        projects,
    })
}

pub async fn load_local_settings() -> Result<Option<LocalSettings>, String> {
    handle_service_error(initialization_service::load_local_settings().await)
}

pub async fn load_current_account() -> Result<Option<Account>, String> {
    handle_service_error(initialization_service::load_current_account().await)
}

pub async fn load_all_project_data() -> Result<Vec<Project>, String> {
    handle_service_error(initialization_service::load_all_project_data().await)
}

pub async fn load_all_account() -> Result<Vec<Account>, String> {
    handle_service_error(initialization_service::load_all_account().await)
}
