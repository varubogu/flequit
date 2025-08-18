use crate::errors::service_error::ServiceError;
use crate::models::account::Account;
use crate::models::project::Project;
use crate::models::setting::LocalSettings;
use crate::services::initialization_service;

// エラー変換のヘルパー関数
fn handle_service_error<T>(result: Result<T, ServiceError>) -> Result<T, String> {
    result.map_err(|e| format!("{:?}", e))
}

pub async fn load_all_data() -> Result<Option<LocalSettings>, String> {
    // TODO: InitializedResultからLocalSettingsへの適切な変換を実装
    Ok(Some(LocalSettings {
        theme: "system".to_string(),
        language: "ja".to_string(),
    }))
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
