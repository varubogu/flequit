use tauri::State;
use crate::services::AutomergeService;
use crate::types::ProjectTree;

#[tauri::command]
pub fn create_project(
    state: State<AutomergeService>,
    name: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<ProjectTree, String> {
    let manager = state.lock().unwrap();
    manager.create_project(name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(
    state: State<AutomergeService>,
    project_id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
) -> Result<Option<ProjectTree>, String> {
    let manager = state.lock().unwrap();
    manager.update_project(&project_id, name, description, color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(
    state: State<AutomergeService>,
    project_id: String,
) -> Result<bool, String> {
    let manager = state.lock().unwrap();
    manager.delete_project(&project_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project_trees(
    state: State<AutomergeService>,
) -> Result<Vec<ProjectTree>, String> {
    let manager = state.lock().unwrap();
    manager.get_project_trees()
        .map_err(|e| e.to_string())
}