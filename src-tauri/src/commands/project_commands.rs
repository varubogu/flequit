use crate::facades::project_facades;
use crate::models::project_models::Project;
use crate::models::search_request_models::ProjectSearchRequest;

#[tauri::command]
pub async fn create_project(project: Project) -> Result<bool, String> {
    project_facades::create_project(&project).await
}

#[tauri::command]
pub async fn get_project(id: String) -> Result<Option<Project>, String> {
    project_facades::get_project(&id).await
}

#[tauri::command]
pub async fn update_project(project: Project) -> Result<bool, String> {
    project_facades::update_project(&project).await
}

#[tauri::command]
pub async fn delete_project(id: String) -> Result<bool, String> {
    project_facades::delete_project(&id).await
}

#[tauri::command]
pub async fn search_projects(condition: ProjectSearchRequest) -> Result<Vec<Project>, String> {
    project_facades::search_projects(&condition).await
}