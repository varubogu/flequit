use crate::facades::account_facades;
use crate::models::account::PartialAccount;
use crate::models::command::account::AccountCommand;
use crate::models::command::ModelConverter;
use crate::models::CommandModelConverter;
use crate::types::id_types::AccountId;

#[tauri::command]
pub async fn create_account(account: AccountCommand) -> Result<bool, String> {
    let internal_account = account.to_model().await?;

    account_facades::create_account(&internal_account).await
}

#[tauri::command]
pub async fn get_account(id: String) -> Result<Option<AccountCommand>, String> {
    let account_id = AccountId::from(id);
    let result = account_facades::get_account(&account_id).await?;
    if let Some(account) = result {
        let command_model = account.to_command_model().await?;
        Ok(Some(command_model))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn update_account(id: String, patch: PartialAccount) -> Result<bool, String> {
    let account_id = AccountId::from(id);
    account_facades::update_account(&account_id, &patch).await
}

#[tauri::command]
pub async fn delete_account(account_id: String) -> Result<bool, String> {
    let id = AccountId::from(account_id);
    account_facades::delete_account(&id).await
}
