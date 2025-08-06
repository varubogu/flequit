use tauri::State;
use crate::services::AutomergeService;

#[tauri::command]
pub fn get_document_state(
    state: State<AutomergeService>,
) -> Result<Vec<u8>, String> {
    let manager = state.lock().unwrap();
    Ok(manager.get_document_state())
}

#[tauri::command]
pub fn load_document_state(
    state: State<AutomergeService>,
    data: Vec<u8>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.load_document_state(&data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_document(
    state: State<AutomergeService>,
    data: Vec<u8>,
) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.merge_document(&data)
        .map_err(|e| e.to_string())
}