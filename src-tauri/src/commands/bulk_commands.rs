use tauri::State;
use crate::services::AutomergeService;

#[tauri::command]
pub fn bulk_move_tasks(
    state: State<AutomergeService>,
    task_ids: Vec<String>,
    target_list_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.bulk_move_tasks(task_ids, target_list_id)
        .map_err(|e| e.to_string())
}