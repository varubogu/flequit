use tauri::State;
use crate::services::AutomergeService;
use crate::types::Tag;

#[tauri::command]
pub fn create_tag(
    state: State<AutomergeService>,
    name: String,
    color: Option<String>,
) -> Result<Tag, String> {
    let manager = state.lock().unwrap();
    manager.create_tag(name, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_tag(
    state: State<AutomergeService>,
    tag_id: String,
    name: Option<String>,
    color: Option<String>,
) -> Result<Option<Tag>, String> {
    let manager = state.lock().unwrap();
    manager.update_tag(&tag_id, name, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_tag(
    state: State<AutomergeService>,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_tag(&tag_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_tags(
    state: State<AutomergeService>,
) -> Result<Vec<Tag>, String> {
    let manager = state.lock().unwrap();
    manager.get_all_tags()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_tag_to_task(
    state: State<AutomergeService>,
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.add_tag_to_task(&task_id, &tag_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_tag_from_task(
    state: State<AutomergeService>,
    task_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.remove_tag_from_task(&task_id, &tag_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_tag_to_subtask(
    state: State<AutomergeService>,
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.add_tag_to_subtask(&subtask_id, &tag_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_tag_from_subtask(
    state: State<AutomergeService>,
    subtask_id: String,
    tag_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.remove_tag_from_subtask(&subtask_id, &tag_id)
        .map_err(|e| e.to_string())
}