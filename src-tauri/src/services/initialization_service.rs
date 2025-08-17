use crate::models::setting::LocalSettings;
use crate::models::account::Account;
use crate::models::project::ProjectTree;
use crate::errors::service_error::ServiceError;


pub async fn load_local_settings() -> Result<Option<LocalSettings>, ServiceError> {
    // 一時的にデフォルト値を返す
    Ok(Some(LocalSettings {
        theme: "system".to_string(),
        language: "ja".to_string(),
    }))
}

pub async fn load_current_account() -> Result<Option<Account>, ServiceError> {
    // 一時的にNoneを返す
    Ok(None)
}

pub async fn load_all_project_data() -> Result<Vec<ProjectTree>, ServiceError> {
    // 一時的に空のVecを返す
    Ok(Vec::new())
}

pub async fn load_all_account() -> Result<Vec<Account>, ServiceError> {
    // 一時的に空のVecを返す
    Ok(Vec::new())
}

pub async fn initialize_application() -> Result<(), ServiceError> {
    // 一時的に何もしない
    Ok(())
}
