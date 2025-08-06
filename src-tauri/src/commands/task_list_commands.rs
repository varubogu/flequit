use tauri::State;
use crate::services::AutomergeService;
use crate::types::TaskListWithTasks;

#[tauri::command]
pub fn create_task_list(
    state: State<AutomergeService>,
    project_id: String,
    name: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<TaskListWithTasks, String> {
    let manager = state.lock().unwrap();
    manager.create_task_list(project_id, name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_task_list(
    state: State<AutomergeService>,
    task_list_id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
) -> Result<Option<TaskListWithTasks>, String> {
    let manager = state.lock().unwrap();
    manager.update_task_list(&task_list_id, name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_task_list(
    state: State<AutomergeService>,
    task_list_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_task_list(&task_list_id)
        .map_err(|e| e.to_string())
}