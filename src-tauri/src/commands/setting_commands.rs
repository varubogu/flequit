use crate::facades::setting_facades;
use crate::models::setting_models::Setting;

#[tauri::command]
pub async fn get_setting(key: String) -> Result<Option<Setting>, String> {
    setting_facades::get_setting(&key).await
}

#[tauri::command]
pub async fn get_all_settings() -> Result<Vec<Setting>, String> {
    setting_facades::get_all_settings().await
}

#[tauri::command]
pub async fn update_setting(setting: Setting) -> Result<bool, String> {
    setting_facades::update_setting(&setting).await
}