use crate::facades::task_list_facades;
use crate::models::search_request_models::TaskListSearchRequest;
use crate::models::task_list_models::TaskList;

#[tauri::command]
pub fn create_task_list(task_list: TaskList) -> Result<bool, String> {
    task_list_facades::create_task_list(&task_list)
}

#[tauri::command]
pub fn get_task_list(id: String) -> Result<Option<TaskList>, String> {
    task_list_facades::get_task_list(&id)
}

#[tauri::command]
pub fn update_task_list(task_list: TaskList) -> Result<bool, String> {
    task_list_facades::update_task_list(&task_list)
}

#[tauri::command]
pub fn delete_task_list(id: String) -> Result<bool, String> {
    task_list_facades::delete_task_list(&id)
}

#[tauri::command]
pub fn search_task_lists(condition: TaskListSearchRequest) -> Result<Vec<TaskList>, String> {
    task_list_facades::search_task_lists(&condition)
}
