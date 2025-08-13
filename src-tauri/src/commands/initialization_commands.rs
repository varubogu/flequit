use crate::facades::initialization_facades;
use crate::models::account_models::Account;
use crate::models::project_models::ProjectTree;
use crate::models::setting_models::LocalSettings;

#[tauri::command]
pub async fn load_local_settings() -> Result<Option<LocalSettings>, String> {
    initialization_facades::load_local_settings().await
}

#[tauri::command]
pub async fn load_current_account() -> Result<Option<Account>, String> {
    initialization_facades::load_current_account().await
}

#[tauri::command]
pub async fn load_all_project_data() -> Result<Vec<ProjectTree>, String> {
    initialization_facades::load_all_project_data().await
}

#[tauri::command]
pub async fn load_all_account() -> Result<Vec<Account>, String> {
    initialization_facades::load_all_account().await
}