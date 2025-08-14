use crate::models::setting::Setting;
use crate::errors::service_error::ServiceError;

#[allow(dead_code)]
pub struct SettingService;

#[allow(dead_code)]
impl SettingService {
    pub async fn get_setting(
        &self,
        key: &str,
    ) -> Result<Option<Setting>, ServiceError> {
        // 一時的にNoneを返す
        let _ = key;
        Ok(None)
    }

    pub async fn get_all_settings(
        &self,
    ) -> Result<Vec<Setting>, ServiceError> {
        // 一時的に空のVecを返す
        Ok(Vec::new())
    }

    pub async fn update_setting(
        &self,
        setting: &Setting,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = setting;
        Ok(())
    }

    pub async fn delete_setting(
        &self,
        key: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = key;
        Ok(())
    }

    pub async fn create_setting(
        &self,
        setting: &Setting,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = setting;
        Ok(())
    }
}