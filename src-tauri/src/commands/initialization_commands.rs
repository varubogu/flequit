use crate::models::command_models::{LocalSettings, Account, ProjectTree};

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

// Account interface compatibility aliases
#[tauri::command]
pub async fn get_account(id: String) -> Result<Option<Account>, String> {
    println!("get_account called");
    println!("id: {}", id);
    
    // 現在は実装なしのため、Noneを返す
    // 実際にはデータベースからアカウント情報を取得する実装が必要
    Ok(None)
}

#[tauri::command]
pub async fn update_account(account: Account) -> Result<bool, String> {
    println!("update_account called");
    println!("account: {:?}", account);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはデータベースにアカウント情報を更新する実装が必要
    Ok(true)
}