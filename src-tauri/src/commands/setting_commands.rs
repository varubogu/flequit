use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub id: String,
    pub key: String,
    pub value: String,
    pub data_type: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingResponse {
    pub success: bool,
    pub data: Option<Setting>,
    pub message: Option<String>,
}

#[tauri::command]
pub async fn get_setting(key: String) -> Result<Option<Setting>, String> {
    println!("get_setting called");
    println!("key: {}", key);
    
    // 現在は実装なしのため、Noneを返す
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

#[tauri::command]
pub async fn get_all_settings() -> Result<Vec<Setting>, String> {
    println!("get_all_settings called");
    
    // 現在は実装なしのため、空のベクタを返す
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(vec![])
}

#[tauri::command]
pub async fn update_setting(setting: Setting) -> Result<bool, String> {
    println!("update_setting called");
    println!("setting: {:?}", setting);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}