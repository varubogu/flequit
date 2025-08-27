use flequit_core::facades::project_facades;
use flequit_core::models::command::project::{ProjectCommand, ProjectSearchRequest};
use flequit_core::models::command::ModelConverter;
use flequit_core::models::project::PartialProject;
use flequit_core::models::CommandModelConverter;
use flequit_core::types::id_types::ProjectId;

#[tracing::instrument]
#[tauri::command]
pub async fn create_project(project: ProjectCommand) -> Result<bool, String> {
    let internal_project = project.to_model().await?;

    project_facades::create_project(&internal_project).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_project(id: String) -> Result<Option<ProjectCommand>, String> {
    let project_id = ProjectId::from(id);
    let result = project_facades::get_project(&project_id).await?;
    match result {
        Some(project) => Ok(Some(project.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_project(id: String, patch: PartialProject) -> Result<bool, String> {
    let project_id = ProjectId::from(id);
    project_facades::update_project(&project_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_project(id: String) -> Result<bool, String> {
    let project_id = ProjectId::from(id);
    project_facades::delete_project(&project_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn search_projects(
    condition: ProjectSearchRequest,
) -> Result<Vec<ProjectCommand>, String> {
    let results = project_facades::search_projects(&condition).await?;
    let mut command_results = Vec::new();
    for project in results {
        command_results.push(project.to_command_model().await?);
    }
    Ok(command_results)
}
