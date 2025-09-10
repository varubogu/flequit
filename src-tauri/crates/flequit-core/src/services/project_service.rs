use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::task_projects::project::{PartialProject, Project};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::types::id_types::ProjectId;
use chrono::Utc;

#[tracing::instrument(level = "trace")]
pub async fn create_project<R>(repositories: &R, project: &Project) -> Result<Project, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync, {
    let mut new_project = project.clone();
    let now = Utc::now();
    new_project.created_at = now;
    new_project.updated_at = now;

    if new_project.id.to_string().trim().is_empty() {
        new_project.id = ProjectId::new();
    }

    repositories.projects().save(&new_project).await?;

    Ok(new_project)
}

#[tracing::instrument(level = "trace")]
pub async fn get_project<R>(repositories: &R, project_id: &ProjectId) -> Result<Option<Project>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync, {
    Ok(repositories.projects().find_by_id(project_id).await?)
}

#[tracing::instrument(level = "trace")]
pub async fn list_projects<R>(repositories: &R) -> Result<Vec<Project>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync, {
    Ok(repositories.projects().find_all().await?)
}

#[tracing::instrument(level = "trace")]
pub async fn update_project<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _patch: &PartialProject,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync, {
    // TODO: Infrastructure層にpatchメソッドが実装されたら有効化
    Err(ServiceError::InternalError("Project patch method is not implemented".to_string()))
}

#[tracing::instrument(level = "trace")]
pub async fn delete_project<R>(repositories: &R, project_id: &ProjectId) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync, {
    repositories.projects().delete(project_id).await?;
    Ok(())
}
