use crate::errors::service_error::ServiceError;
use crate::models::setting::Setting;
use crate::services::setting_service::SettingService;

pub async fn get_setting(key: &str) -> Result<Option<Setting>, String> {
    let service = SettingService;

    match service.get_setting(key).await {
        Ok(setting) => Ok(setting),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get setting: {:?}", e)),
    }
}

pub async fn get_all_settings() -> Result<Vec<Setting>, String> {
    let service = SettingService;

    match service.get_all_settings().await {
        Ok(settings) => Ok(settings),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all settings: {:?}", e)),
    }
}

pub async fn update_setting(setting: &Setting) -> Result<bool, String> {
    let service = SettingService;

    match service.update_setting(setting).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update setting: {:?}", e)),
    }
}
