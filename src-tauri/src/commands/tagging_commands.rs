use crate::models::subtask_tag::SubtaskTagCommandModel;
use crate::models::task_tag::TaskTagCommandModel;
use crate::state::AppState;
use flequit_core::facades::{task_facades, subtask_facades};
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId, TaskId};
use tauri::State;

// TaskTag関連コマンド（CRUD）


#[tauri::command]
pub async fn create_task_tag(
    state: State<'_, AppState>,
    project_id: String,
    task_tag: TaskTagCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = TaskId::from(task_tag.task_id);
    let tag_id = TagId::from(task_tag.tag_id);
    let repositories = state.repositories.read().await;

    task_facades::add_task_tag_relation(&*repositories, &project_id, &task_id, &tag_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tagging", command = "create_task_tag", project_id = %project_id, task_id = %task_id, tag_id = %tag_id, error = %e);
            e
        })
}


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


#[tauri::command]
pub async fn create_task_tag_by_name(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
    tag_name: String,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = TaskId::from(task_id);
    let repositories = state.repositories.read().await;
    task_facades::add_task_tag(&*repositories, &project_id, &task_id, &tag_name)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tagging", command = "create_task_tag_by_name", project_id = %project_id, task_id = %task_id, tag_name = %tag_name, error = %e);
            e
        })
}

#[tauri::command]
pub async fn create_subtask_tag_by_name(
    state: State<'_, AppState>,
    project_id: String,
    subtask_id: String,
    tag_name: String,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = SubTaskId::from(subtask_id);
    let repositories = state.repositories.read().await;
    subtask_facades::add_subtask_tag_by_name(&*repositories, &project_id, &subtask_id, &tag_name)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tagging", command = "create_subtask_tag_by_name", project_id = %project_id, subtask_id = %subtask_id, tag_name = %tag_name, error = %e);
            e
        })
}

// 名前指定の削除は行わず、削除はID厳格指定の既存コマンドを使用する

#[tauri::command]
pub async fn create_subtask_tag(
    state: State<'_, AppState>,
    project_id: String,
    subtask_tag: SubtaskTagCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = SubTaskId::from(subtask_tag.subtask_id);
    let tag_id = TagId::from(subtask_tag.tag_id);
    let repositories = state.repositories.read().await;

    subtask_facades::add_subtask_tag_relation(&*repositories, &project_id, &subtask_id, &tag_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tagging", command = "create_subtask_tag", project_id = %project_id, subtask_id = %subtask_id, tag_id = %tag_id, error = %e);
            e
        })
}


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
