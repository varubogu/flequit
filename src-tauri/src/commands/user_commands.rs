use crate::models::user::{PartialUserCommandModel, UserCommandModel};
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::user_facades;
use flequit_model::models::users::user::User;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::UserId;
use tauri::State;
use tracing::instrument;

#[instrument(level = "info", skip(state, user), fields(user_id = %user.id))]
#[tauri::command]
pub async fn create_user(
    state: State<'_, AppState>,
    user: UserCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let internal_user = user.to_model().await?;
    user_facades::create_user(&*repositories, &internal_user)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user", command = "create_user", error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(user_id = %id))]
#[tauri::command]
pub async fn get_user(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<UserCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let user_id = UserId::from(id);
    let result = user_facades::get_user(&*repositories, &user_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user", command = "get_user", user_id = %user_id, error = %e);
            e
        })?;
    if let Some(user) = result {
        let command_model = user.to_command_model().await?;
        Ok(Some(command_model))
    } else {
        Ok(None)
    }
}

#[instrument(level = "info", skip(state, patch), fields(user_id = %id))]
#[tauri::command]
pub async fn update_user(
    state: State<'_, AppState>,
    id: String,
    patch: PartialUserCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let user_id = UserId::from(id);

    // 既存のユーザーを取得
    let existing_user = match user_facades::get_user(&*repositories, &user_id).await? {
        Some(user) => user,
        None => return Err("User not found".to_string()),
    };

    // PartialUserCommandModelから部分更新を適用した新しいUserを作成
    let updated_user = User {
        id: existing_user.id,
        handle_id: patch.handle_id.unwrap_or(existing_user.handle_id),
        display_name: patch.display_name.unwrap_or(existing_user.display_name),
        email: patch.email.unwrap_or(existing_user.email),
        avatar_url: patch.avatar_url.unwrap_or(existing_user.avatar_url),
        bio: patch.bio.unwrap_or(existing_user.bio),
        timezone: patch.timezone.unwrap_or(existing_user.timezone),
        is_active: patch.is_active.unwrap_or(existing_user.is_active),
        created_at: existing_user.created_at,
        updated_at: chrono::Utc::now(), // 更新時刻を現在時刻に設定
    };

    user_facades::update_user(&*repositories, &updated_user)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user", command = "update_user", user_id = %user_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(user_id = %user_id))]
#[tauri::command]
pub async fn delete_user(state: State<'_, AppState>, user_id: String) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let id = UserId::from(user_id);
    user_facades::delete_user(&*repositories, &id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::user", command = "delete_user", user_id = %id, error = %e);
            e
        })
}
