use crate::errors::service_error::ServiceError;
use crate::models::setting::Setting;

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
