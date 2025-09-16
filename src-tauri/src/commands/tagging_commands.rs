use crate::models::subtask_tag::SubtaskTagCommandModel;
use crate::models::task_tag::TaskTagCommandModel;
use crate::state::AppState;
use flequit_core::facades::tagging_facades;
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

    tagging_facades::add_task_tag_relation(&*repositories, &project_id, &task_id, &tag_id).await
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

    tagging_facades::remove_task_tag_relation(&*repositories, &project_id, &task_id_typed, &tag_id_typed).await
}

// SubtaskTag関連コマンド（CRUD）


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

    tagging_facades::add_subtask_tag_relation(&*repositories, &project_id, &subtask_id, &tag_id).await
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

    tagging_facades::remove_subtask_tag_relation(&*repositories, &project_id, &subtask_id_typed, &tag_id_typed)
        .await
}
