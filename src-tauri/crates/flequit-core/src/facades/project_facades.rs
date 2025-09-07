use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::task_projects::project::{PartialProject, Project};
use crate::services::project_service;
use flequit_model::types::id_types::ProjectId;
use flequit_infrastructure::InfrastructureRepositories;

#[tracing::instrument]
pub async fn create_project(project: &Project) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match project_service::create_project(&repositories, project).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create project: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn get_project(id: &ProjectId) -> Result<Option<Project>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match project_service::get_project(&repositories, id).await {
        Ok(Some(project)) => Ok(Some(project)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get project: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn update_project(
    project_id: &ProjectId,
    patch: &PartialProject,
) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match project_service::update_project(&repositories, project_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update project: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn delete_project(id: &ProjectId) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match project_service::delete_project(&repositories, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete project: {:?}", e)),
    }
}
