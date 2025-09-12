use crate::models::account::AccountCommandModel;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::account_facades;
use flequit_model::models::accounts::account::PartialAccount;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::AccountId;
use tauri::State;

#[tracing::instrument]
#[tauri::command]
pub async fn create_account(
    state: State<'_, AppState>,
    account: AccountCommandModel,
) -> Result<bool, String> {
    let internal_account = account.to_model().await?;
    let repositories = state.repositories.read().await;

    account_facades::create_account(&*repositories, &internal_account).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_account(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<AccountCommandModel>, String> {
    let account_id = AccountId::from(id);
    let repositories = state.repositories.read().await;

    let result = account_facades::get_account(&*repositories, &account_id).await?;
    if let Some(account) = result {
        let command_model = account.to_command_model().await?;
        Ok(Some(command_model))
    } else {
        Ok(None)
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_account(
    state: State<'_, AppState>,
    id: String,
    patch: PartialAccount,
) -> Result<bool, String> {
    let account_id = AccountId::from(id);
    let repositories = state.repositories.read().await;

    account_facades::update_account(&*repositories, &account_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_account(
    state: State<'_, AppState>,
    account_id: String,
) -> Result<bool, String> {
    let id = AccountId::from(account_id);
    let repositories = state.repositories.read().await;

    account_facades::delete_account(&*repositories, &id).await
}
