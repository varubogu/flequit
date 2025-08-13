use crate::facades::subtask_facades;
use crate::models::search_request_models::SubtaskSearchRequest;
use crate::models::sub_task_models::Subtask;

// Frontend compatibility aliases only
#[tauri::command]
pub async fn create_sub_task(sub_task: Subtask) -> Result<bool, String> {
    subtask_facades::create_sub_task(&sub_task).await
}

#[tauri::command]
pub async fn get_sub_task(id: String) -> Result<Option<Subtask>, String> {
    subtask_facades::get_sub_task(&id).await
}

#[tauri::command]
pub async fn update_sub_task(sub_task: Subtask) -> Result<bool, String> {
    subtask_facades::update_sub_task(&sub_task).await
}

#[tauri::command]
pub async fn delete_sub_task(id: String) -> Result<bool, String> {
    subtask_facades::delete_sub_task(&id).await
}

#[tauri::command]
pub async fn search_sub_tasks(condition: SubtaskSearchRequest) -> Result<Vec<Subtask>, String> {
    subtask_facades::search_sub_tasks(&condition).await
}