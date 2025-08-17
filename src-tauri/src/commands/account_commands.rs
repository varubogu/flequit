use crate::facades::account_facades;
use crate::models::command::account::AccountCommand;
use crate::models::command::ModelConverter;
use crate::models::CommandModelConverter;

#[tauri::command]
pub async fn create_account(account: AccountCommand) -> Result<bool, String> {
    let internal_account = account.to_model().await?;

    account_facades::create_account(&internal_account).await
}

#[tauri::command]
pub async fn get_account(id: String) -> Result<Option<AccountCommand>, String> {
    let result = account_facades::get_account(&id).await?;
    Ok(result.unwrap().to_command_model().await?.into())
}

#[tauri::command]
pub async fn update_account(account: AccountCommand) -> Result<bool, String> {
    let internal_account = account.to_model().await?;
    account_facades::update_account(&internal_account).await
}

#[tauri::command]
pub async fn delete_account(account_id: String) -> Result<bool, String> {
    account_facades::delete_account(&account_id).await
}
