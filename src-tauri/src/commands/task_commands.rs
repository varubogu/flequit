use tauri::State;
use crate::services::AutomergeService;
use crate::types::{Task, TaskWithSubTasks};

#[tauri::command]
pub fn create_task(
    state: State<AutomergeService>,
    title: String,
    description: String,
) -> Result<Task, String> {
    let manager = state.lock().unwrap();
    manager.create_task(title, description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_task(
    state: State<AutomergeService>,
    task_id: String,
) -> Result<Option<Task>, String> {
    let manager = state.lock().unwrap();
    manager.get_task(&task_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_tasks(
    state: State<AutomergeService>,
) -> Result<Vec<Task>, String> {
    let manager = state.lock().unwrap();
    manager.get_all_tasks()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_task(
    state: State<AutomergeService>,
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    completed: Option<bool>,
) -> Result<Option<Task>, String> {
    let manager = state.lock().unwrap();
    manager.update_task(&task_id, title, description, completed)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_task(
    state: State<AutomergeService>,
    task_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_task(&task_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_task_with_subtasks(
    state: State<AutomergeService>,
    list_id: String,
    title: String,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
    start_date: Option<i64>,
    end_date: Option<i64>,
) -> Result<TaskWithSubTasks, String> {
    let manager = state.lock().unwrap();
    manager.create_task_with_subtasks(
        list_id, title, description, status, priority, start_date, end_date
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_task_with_subtasks(
    state: State<AutomergeService>,
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<i32>,
    start_date: Option<i64>,
    end_date: Option<i64>,
) -> Result<Option<TaskWithSubTasks>, String> {
    let manager = state.lock().unwrap();
    manager.update_task_with_subtasks(
        &task_id, title, description, status, priority, start_date, end_date
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_task_with_subtasks(
    state: State<AutomergeService>,
    task_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_task_with_subtasks(&task_id)
        .map_err(|e| e.to_string())
}