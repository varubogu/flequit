use crate::errors::service_error::ServiceError;
use crate::models::setting::Setting;

/// 設定サービス（一時的なモック実装）
pub struct SettingService;

impl SettingService {
    pub fn new() -> Self {
        Self
    }

    pub async fn get_setting(&self, key: &str) -> Result<Option<Setting>, ServiceError> {
        get_setting(key).await
    }

    pub async fn get_all_settings(&self) -> Result<Vec<Setting>, ServiceError> {
        get_all_settings().await
    }

    pub async fn update_setting(&self, setting: &Setting) -> Result<(), ServiceError> {
        update_setting(setting).await
    }
}

pub async fn get_setting(key: &str) -> Result<Option<Setting>, ServiceError> {
    // 一時的にNoneを返す
    let _ = key;
    Ok(None)
}

pub async fn get_all_settings() -> Result<Vec<Setting>, ServiceError> {
    // 一時的に空のVecを返す
    Ok(Vec::new())
}

pub async fn update_setting(setting: &Setting) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = setting;
    Ok(())
}

pub async fn delete_setting(key: &str) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = key;
    Ok(())
}

pub async fn create_setting(setting: &Setting) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = setting;
    Ok(())
}
