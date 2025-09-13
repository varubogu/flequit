use crate::models::user::UserCommandModel;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::user_facades;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::UserId;
use tauri::State;


#[tauri::command]
pub async fn create_user(
    state: State<'_, AppState>,
    user: UserCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let internal_user = user.to_model().await?;
    user_facades::create_user(&*repositories, &internal_user).await
}


#[tauri::command]
pub async fn get_user(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<UserCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let user_id = UserId::from(id);
    let result = user_facades::get_user(&*repositories, &user_id).await?;
    if let Some(user) = result {
        let command_model = user.to_command_model().await?;
        Ok(Some(command_model))
    } else {
        Ok(None)
    }
}


#[tauri::command]
pub async fn update_user(
    state: State<'_, AppState>,
    user: UserCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let internal_user = user.to_model().await?;
    user_facades::update_user(&*repositories, &internal_user).await
}


#[tauri::command]
pub async fn delete_user(state: State<'_, AppState>, user_id: String) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let id = UserId::from(user_id);
    user_facades::delete_user(&*repositories, &id).await
}
