use flequit_core::facades::tagging_facades;
use crate::models::tagging::{TaskTagCommand, SubtaskTagCommand};
use flequit_model::types::id_types::{TaskId, SubTaskId, TagId};

// TaskTag関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_task_tag(task_tag: TaskTagCommand) -> Result<bool, String> {
    let task_id = TaskId::from(task_tag.task_id);
    let tag_id = TagId::from(task_tag.tag_id);
    tagging_facades::add_task_tag_relation(&task_id, &tag_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_task_tag(task_id: String, tag_id: String) -> Result<bool, String> {
    let task_id_typed = TaskId::from(task_id);
    let tag_id_typed = TagId::from(tag_id);
    tagging_facades::remove_task_tag_relation(&task_id_typed, &tag_id_typed).await
}

// SubtaskTag関連コマンド（CRUD）

#[tracing::instrument]
#[tauri::command]
pub async fn create_subtask_tag(subtask_tag: SubtaskTagCommand) -> Result<bool, String> {
    let subtask_id = SubTaskId::from(subtask_tag.subtask_id);
    let tag_id = TagId::from(subtask_tag.tag_id);
    tagging_facades::add_subtask_tag_relation(&subtask_id, &tag_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_subtask_tag(subtask_id: String, tag_id: String) -> Result<bool, String> {
    let subtask_id_typed = SubTaskId::from(subtask_id);
    let tag_id_typed = TagId::from(tag_id);
    tagging_facades::remove_subtask_tag_relation(&subtask_id_typed, &tag_id_typed).await
}