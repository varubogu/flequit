use crate::models::subtask_tag::SubtaskTagCommandModel;
use crate::models::task_tag::TaskTagCommandModel;
use crate::state::AppState;
use flequit_core::facades::tagging_facades;
use flequit_model::types::id_types::{SubTaskId, TagId, TaskId};
use tauri::State;

// TaskTag関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_task_tag(
    state: State<'_, AppState>,
    task_tag: TaskTagCommandModel,
) -> Result<bool, String> {
    let task_id = TaskId::from(task_tag.task_id);
    let tag_id = TagId::from(task_tag.tag_id);
    let repositories = state.repositories.read().await;

    tagging_facades::add_task_tag_relation(&*repositories, &task_id, &tag_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_task_tag(
    state: State<'_, AppState>,
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let task_id_typed = TaskId::from(task_id);
    let tag_id_typed = TagId::from(tag_id);
    let repositories = state.repositories.read().await;

    tagging_facades::remove_task_tag_relation(&*repositories, &task_id_typed, &tag_id_typed).await
}

// SubtaskTag関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_subtask_tag(
    state: State<'_, AppState>,
    subtask_tag: SubtaskTagCommandModel,
) -> Result<bool, String> {
    let subtask_id = SubTaskId::from(subtask_tag.subtask_id);
    let tag_id = TagId::from(subtask_tag.tag_id);
    let repositories = state.repositories.read().await;

    tagging_facades::add_subtask_tag_relation(&*repositories, &subtask_id, &tag_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_subtask_tag(
    state: State<'_, AppState>,
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let subtask_id_typed = SubTaskId::from(subtask_id);
    let tag_id_typed = TagId::from(tag_id);
    let repositories = state.repositories.read().await;

    tagging_facades::remove_subtask_tag_relation(&*repositories, &subtask_id_typed, &tag_id_typed)
        .await
}
