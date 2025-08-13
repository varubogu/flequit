use crate::models::setting_models::LocalSettings;
use crate::models::account_models::Account;
use crate::models::project_models::ProjectTree;

#[tauri::command]
pub async fn load_local_settings() -> Result<Option<LocalSettings>, String> {
    println!("load_local_settings called");
    
    // 現在は実装なしのため、デフォルト設定を返す
    // 実際にはローカルファイルから設定を読み込む実装が必要
    Ok(Some(LocalSettings {
        theme: "system".to_string(),
        language: "ja".to_string(),
    }))
}

#[tauri::command]
pub async fn load_current_account() -> Result<Option<Account>, String> {
    println!("load_current_account called");
    
    // 現在は実装なしのため、Noneを返す
    // 実際にはデータベースからアカウント情報を取得する実装が必要
    Ok(None)
}

#[tauri::command]
pub async fn load_all_project_data() -> Result<Vec<ProjectTree>, String> {
    println!("load_all_project_data called");
    
    // 現在は実装なしのため、空のベクタを返す
    // 実際にはデータベースから全プロジェクトデータを取得する実装が必要
    Ok(vec![])
}

#[tauri::command]
pub async fn load_all_account() -> Result<Vec<Account>, String> {
    println!("load_all_account called");
    
    // 現在は実装なしのため、空のベクタを返す
    // 実際にはデータベースから全アカウント情報を取得する実装が必要
    Ok(vec![])
}