use crate::facades::setting_facades;
use crate::models::command::setting::SettingCommand;
use crate::models::command::ModelConverter;
use crate::models::CommandModelConverter;

#[tauri::command]
pub async fn get_setting(key: String) -> Result<Option<SettingCommand>, String> {
    let result = setting_facades::get_setting(&key).await?;
    match result {
        Some(setting) => Ok(Some(setting.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn get_all_settings() -> Result<Vec<SettingCommand>, String> {
    let results = setting_facades::get_all_settings().await?;
    let mut command_results = Vec::new();
    for setting in results {
        command_results.push(setting.to_command_model().await?);
    }
    Ok(command_results)
}

#[tauri::command]
pub async fn update_setting(setting: SettingCommand) -> Result<bool, String> {
    let internal_setting = setting.to_model().await?;
    setting_facades::update_setting(&internal_setting).await
}
