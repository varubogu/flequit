use crate::models::project::ProjectCommandModel;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::project_facades;
use flequit_model::models::{task_projects::project::PartialProject, ModelConverter};
use flequit_model::types::id_types::ProjectId;
use tauri::State;


#[tauri::command]
pub async fn create_project(
    state: State<'_, AppState>,
    project: ProjectCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let internal_project = project.to_model().await?;

    project_facades::create_project(&*repositories, &internal_project).await
}


#[tauri::command]
pub async fn get_project(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<ProjectCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    let result = project_facades::get_project(&*repositories, &project_id).await?;
    match result {
        Some(project) => Ok(Some(project.to_command_model().await?)),
        None => Ok(None),
    }
}


#[tauri::command]
pub async fn update_project(
    state: State<'_, AppState>,
    id: String,
    patch: PartialProject,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    project_facades::update_project(&*repositories, &project_id, &patch).await
}


#[tauri::command]
pub async fn delete_project(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = ProjectId::from(id);
    project_facades::delete_project(&*repositories, &project_id).await
}
