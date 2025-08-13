use crate::facades::account_facades;
use crate::models::account_models::Account;

#[tauri::command]
pub async fn create_account(account: Account) -> Result<bool, String> {
    account_facades::create_account(&account).await
}

#[tauri::command]
pub async fn get_account(id: String) -> Result<Option<Account>, String> {
    account_facades::get_account(&id).await
}

#[tauri::command]
pub async fn update_account(account: Account) -> Result<bool, String> {
    account_facades::update_account(&account).await
}

#[tauri::command]
pub async fn delete_account(account_id: String) -> Result<bool, String> {
    account_facades::delete_account(&account_id).await
}