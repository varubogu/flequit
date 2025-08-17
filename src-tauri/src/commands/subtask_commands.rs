use crate::facades::subtask_facades;
use crate::models::command::subtask::{SubtaskCommand, SubtaskSearchRequest};
use crate::types::id_types::SubTaskId;

// Frontend compatibility aliases only
#[tauri::command]
pub async fn create_sub_task(sub_task: SubtaskCommand) -> Result<bool, String> {
    subtask_facades::create_sub_task(&sub_task).await
}

#[tauri::command]
pub async fn get_sub_task(id: String) -> Result<Option<SubtaskCommand>, String> {
    let sub_task_id = SubTaskId::from(id);
    subtask_facades::get_sub_task(&sub_task_id).await
}

#[tauri::command]
pub async fn update_sub_task(sub_task: SubtaskCommand) -> Result<bool, String> {
    subtask_facades::update_sub_task(&sub_task).await
}

#[tauri::command]
pub async fn delete_sub_task(id: String) -> Result<bool, String> {
    let sub_task_id = SubTaskId::from(id);
    subtask_facades::delete_sub_task(&sub_task_id).await
}

#[tauri::command]
pub async fn search_sub_tasks(
    condition: SubtaskSearchRequest,
) -> Result<Vec<SubtaskCommand>, String> {
    subtask_facades::search_sub_tasks(&condition).await
}
