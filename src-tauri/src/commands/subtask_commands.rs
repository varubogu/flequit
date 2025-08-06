use tauri::State;
use crate::services::AutomergeService;
use crate::types::SubTask;

#[tauri::command]
pub fn create_subtask(
    state: State<AutomergeService>,
    task_id: String,
    title: String,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
) -> Result<SubTask, String> {
    let manager = state.lock().unwrap();
    manager.create_subtask(&task_id, title, description, status, priority)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_subtask(
    state: State<AutomergeService>,
    subtask_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
) -> Result<Option<SubTask>, String> {
    let manager = state.lock().unwrap();
    manager.update_subtask(&subtask_id, title, description, status, priority)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_subtask(
    state: State<AutomergeService>,
    subtask_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_subtask(&subtask_id)
        .map_err(|e| e.to_string())
}