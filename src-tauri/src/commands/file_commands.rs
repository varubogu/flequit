use tauri::State;
use crate::services::AutomergeService;

#[tauri::command]
pub fn save_data_to_file(
    state: State<AutomergeService>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.save_to_file(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_data_from_file(
    state: State<AutomergeService>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.load_from_file(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn initialize_sample_data(
    state: State<AutomergeService>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.initialize_sample_data()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_data_json(
    state: State<AutomergeService>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.export_to_json(&file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_data_json(
    state: State<AutomergeService>,
    file_path: String,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.import_from_json(&file_path)
        .map_err(|e| e.to_string())
}