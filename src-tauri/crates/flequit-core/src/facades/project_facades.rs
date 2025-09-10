use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::task_projects::project::{PartialProject, Project};
use crate::services::project_service;
use flequit_model::types::id_types::ProjectId;
use flequit_infrastructure::InfrastructureRepositoriesTrait;

#[tracing::instrument(level = "trace")]
pub async fn create_project<R>(repositories: &R, project: &Project) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match project_service::create_project(repositories, project).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create project: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_project<R>(repositories: &R, id: &ProjectId) -> Result<Option<Project>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match project_service::get_project(repositories, id).await {
        Ok(Some(project)) => Ok(Some(project)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get project: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_project<R>(
    repositories: &R,
    project_id: &ProjectId,
    patch: &PartialProject,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match project_service::update_project(repositories, project_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update project: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn delete_project<R>(repositories: &R, id: &ProjectId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match project_service::delete_project(repositories, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete project: {:?}", e)),
    }
}
