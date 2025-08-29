use flequit_core::facades::user_facades;
use crate::models::user::UserCommand;
use flequit_model::models::ModelConverter;
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::UserId;

#[tracing::instrument]
#[tauri::command]
pub async fn create_user(user: UserCommand) -> Result<bool, String> {
    let internal_user = user.to_model().await?;
    user_facades::create_user(&internal_user).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_user(id: String) -> Result<Option<UserCommand>, String> {
    let user_id = UserId::from(id);
    let result = user_facades::get_user(&user_id).await?;
    if let Some(user) = result {
        let command_model = user.to_command_model().await?;
        Ok(Some(command_model))
    } else {
        Ok(None)
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_user(user: UserCommand) -> Result<bool, String> {
    let internal_user = user.to_model().await?;
    user_facades::update_user(&internal_user).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_user(user_id: String) -> Result<bool, String> {
    let id = UserId::from(user_id);
    user_facades::delete_user(&id).await
}