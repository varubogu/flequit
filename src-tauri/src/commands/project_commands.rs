use flequit_core::facades::project_facades;
use crate::models::project::ProjectCommandModel;
use flequit_model::models::{task_projects::project::PartialProject, ModelConverter};
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::ProjectId;
use flequit_infrastructure::InfrastructureRepositories;

#[tracing::instrument]
#[tauri::command]
pub async fn create_project(project: ProjectCommandModel) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    let internal_project = project.to_model().await?;

    project_facades::create_project(&repositories, &internal_project).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_project(id: String) -> Result<Option<ProjectCommandModel>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    let project_id = ProjectId::from(id);
    let result = project_facades::get_project(&repositories, &project_id).await?;
    match result {
        Some(project) => Ok(Some(project.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_project(id: String, patch: PartialProject) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    let project_id = ProjectId::from(id);
    project_facades::update_project(&repositories, &project_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_project(id: String) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    let project_id = ProjectId::from(id);
    project_facades::delete_project(&repositories, &project_id).await
}
