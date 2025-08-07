use tauri::State;
use crate::services::AutomergeService;

#[tauri::command]
pub fn auto_save(state: State<AutomergeService>) -> Result<(), String> {
    let manager = state.lock().unwrap();
    manager.save_to_file(Some("./data/tasks.automerge"))
        .map_err(|e| e.to_string())
}