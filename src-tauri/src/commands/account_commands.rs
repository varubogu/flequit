use crate::models::account_models::Account;

#[tauri::command]
pub async fn create_account(account: Account) -> Result<bool, String> {
    println!("create_account called");
    println!("account: {:?}", account);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを作成する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn get_account(id: String) -> Result<Option<Account>, String> {
    println!("get_account called");
    println!("id: {}", id);
    
    // 現在は実装なしのため、Noneを返す
    // 実際にはサービス層を通してデータを取得する実装が必要
    Ok(None)
}

#[tauri::command]
pub async fn update_account(account: Account) -> Result<bool, String> {
    println!("update_account called");
    println!("account: {:?}", account);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを更新する実装が必要
    Ok(true)
}

#[tauri::command]
pub async fn delete_account(account_id: String) -> Result<bool, String> {
    println!("delete_account called");
    println!("account_id: {}", account_id);
    
    // 現在は実装なしのため、trueを返す
    // 実際にはサービス層を通してデータを削除する実装が必要
    Ok(true)
}