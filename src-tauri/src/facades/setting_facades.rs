use log::info;

use crate::models::setting_models::Setting;

pub async fn get_setting(key: &str) -> Result<Option<Setting>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    info!("get_setting called with account: {:?}", key);
    Ok(None)
}

pub async fn get_all_settings() -> Result<Vec<Setting>, String> {
    // 実際にはサービス層を通してデータを取得する実装が必要
    info!("get_all_settings called");
    Ok(vec![])
}

pub async fn update_setting(setting: &Setting) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを更新する実装が必要
    info!("update_setting called with account: {:?}", setting);
    Ok(true)
}
