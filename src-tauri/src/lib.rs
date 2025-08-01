mod automerge_manager;

use automerge_manager::{AutomergeManager, Task, ProjectTree};
use std::sync::{Arc, Mutex};
use tauri::State;

type AutomergeState = Arc<Mutex<AutomergeManager>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn create_task(
    state: State<AutomergeState>,
    title: String,
    description: String,
) -> Result<Task, String> {
    let manager = state.lock().unwrap();
    manager.create_task(title, description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_task(
    state: State<AutomergeState>,
    task_id: String,
) -> Result<Option<Task>, String> {
    let manager = state.lock().unwrap();
    manager.get_task(&task_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_tasks(
    state: State<AutomergeState>,
) -> Result<Vec<Task>, String> {
    let manager = state.lock().unwrap();
    manager.get_all_tasks()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_task(
    state: State<AutomergeState>,
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
fn delete_task(
    state: State<AutomergeState>,
    task_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_task(&task_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_document_state(
    state: State<AutomergeState>,
) -> Result<Vec<u8>, String> {
    let manager = state.lock().unwrap();
    Ok(manager.get_document_state())
}

#[tauri::command]
fn load_document_state(
    state: State<AutomergeState>,
    data: Vec<u8>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.load_document_state(&data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn merge_document(
    state: State<AutomergeState>,
    data: Vec<u8>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.merge_document(&data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_data_to_file(
    state: State<AutomergeState>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.save_to_file(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn load_data_from_file(
    state: State<AutomergeState>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.load_from_file(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn initialize_sample_data(
    state: State<AutomergeState>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.initialize_sample_data()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_project_trees(
    state: State<AutomergeState>,
) -> Result<Vec<ProjectTree>, String> {
    let manager = state.lock().unwrap();
    manager.get_project_trees()
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let automerge_manager = Arc::new(Mutex::new(AutomergeManager::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(automerge_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            create_task,
            get_task,
            get_all_tasks,
            update_task,
            delete_task,
            get_document_state,
            load_document_state,
            merge_document,
            save_data_to_file,
            load_data_from_file,
            initialize_sample_data,
            get_project_trees
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
