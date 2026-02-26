use crate::models::tag::TagCommandModel;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::{subtask_facades, task_facades};
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId, TaskId, UserId};
use tauri::State;
use tracing::instrument;

// TaskTag関連コマンド（CRUD）

#[instrument(level = "info", skip(state, tag_name), fields(project_id = %project_id, task_id = %task_id))]
#[tauri::command]
pub async fn create_task_tag(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
    tag_name: String,
    user_id: String,
) -> Result<TagCommandModel, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = TaskId::from(task_id);
    let repositories = state.repositories.read().await;

    let result = task_facades::add_task_tag(&*repositories, &project_id, &task_id, &tag_name, &user_id_typed).await;
    if let Err(e) = result {
        tracing::error!(target: "commands::tagging", command = "create_task_tag", project_id = %project_id, task_id = %task_id, tag_name = %tag_name, error = %e);
        return Err(e);
    }
    result.unwrap().to_command_model().await
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %task_id, tag_id = %tag_id))]
#[tauri::command]
pub async fn delete_task_tag(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id_typed = TaskId::from(task_id);
    let tag_id_typed = TagId::from(tag_id);
    let repositories = state.repositories.read().await;

    task_facades::remove_task_tag_relation(&*repositories, &project_id, &task_id_typed, &tag_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tagging", command = "delete_task_tag", project_id = %project_id, task_id = %task_id_typed, tag_id = %tag_id_typed, error = %e);
            e
        })
}

// SubtaskTag関連コマンド（CRUD）

#[instrument(level = "info", skip(state, tag_name), fields(project_id = %project_id, task_id = %task_id))]
#[tauri::command]
pub async fn create_task_tag_by_name(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
    tag_name: String,
    user_id: String,
) -> Result<TagCommandModel, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = TaskId::from(task_id);
    let repositories = state.repositories.read().await;
    let result = task_facades::add_task_tag(&*repositories, &project_id, &task_id, &tag_name, &user_id_typed).await;
    if let Err(e) = result {
        tracing::error!(target: "commands::tagging", command = "create_task_tag_by_name", project_id = %project_id, task_id = %task_id, tag_name = %tag_name, error = %e);
        return Err(e);
    }
    result.unwrap().to_command_model().await
}

#[instrument(level = "info", skip(state, tag_name), fields(project_id = %project_id, subtask_id = %subtask_id))]
#[tauri::command]
pub async fn create_subtask_tag_by_name(
    state: State<'_, AppState>,
    project_id: String,
    subtask_id: String,
    tag_name: String,
    user_id: String,
) -> Result<TagCommandModel, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = SubTaskId::from(subtask_id);
    let repositories = state.repositories.read().await;
    let result =
        subtask_facades::add_subtask_tag(&*repositories, &project_id, &subtask_id, &tag_name, &user_id_typed).await;
    if let Err(e) = result {
        tracing::error!(target: "commands::tagging", command = "create_subtask_tag_by_name", project_id = %project_id, subtask_id = %subtask_id, tag_name = %tag_name, error = %e);
        return Err(e);
    }
    result.unwrap().to_command_model().await
}

// 名前指定の削除は行わず、削除はID厳格指定の既存コマンドを使用する

#[instrument(level = "info", skip(state, tag_name), fields(project_id = %project_id, subtask_id = %subtask_id))]
#[tauri::command]
pub async fn create_subtask_tag(
    state: State<'_, AppState>,
    project_id: String,
    subtask_id: String,
    tag_name: String,
    user_id: String,
) -> Result<TagCommandModel, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = SubTaskId::from(subtask_id);
    let repositories = state.repositories.read().await;

    let result =
        subtask_facades::add_subtask_tag(&*repositories, &project_id, &subtask_id, &tag_name, &user_id_typed).await;
    if let Err(e) = result {
        tracing::error!(target: "commands::tagging", command = "create_subtask_tag", project_id = %project_id, subtask_id = %subtask_id, tag_name = %tag_name, error = %e);
        return Err(e);
    }
    result.unwrap().to_command_model().await
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, subtask_id = %subtask_id, tag_id = %tag_id))]
#[tauri::command]
pub async fn delete_subtask_tag(
    state: State<'_, AppState>,
    project_id: String,
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id_typed = SubTaskId::from(subtask_id);
    let tag_id_typed = TagId::from(tag_id);
    let repositories = state.repositories.read().await;

    subtask_facades::remove_subtask_tag_relation(&*repositories, &project_id, &subtask_id_typed, &tag_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tagging", command = "delete_subtask_tag", project_id = %project_id, subtask_id = %subtask_id_typed, tag_id = %tag_id_typed, error = %e);
            e
        })
}
