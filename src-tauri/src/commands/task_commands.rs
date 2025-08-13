use crate::facades::task_facades;
use crate::models::search_request_models::TaskSearchRequest;
use crate::models::task_models::Task;

#[tauri::command]
pub async fn create_task(task: Task) -> Result<bool, String> {
    task_facades::create_task(&task).await
}

#[tauri::command]
pub async fn get_task(id: String) -> Result<Option<Task>, String> {
    task_facades::get_task(&id).await
}

#[tauri::command]
pub async fn update_task(task: Task) -> Result<bool, String> {
    task_facades::update_task(&task).await
}

#[tauri::command]
pub async fn delete_task(id: String) -> Result<bool, String> {
    task_facades::delete_task(&id).await
}

#[tauri::command]
pub async fn search_tasks(condition: TaskSearchRequest) -> Result<Vec<Task>, String> {
    task_facades::search_tasks(&condition).await
}