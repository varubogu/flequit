use crate::InfrastructureRepositoriesTrait;
use chrono::Utc;
use flequit_model::models::task_projects::project::{PartialProject, Project};
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::patchable_trait::Patchable;
use flequit_types::errors::service_error::ServiceError;

pub async fn create_project<R>(
    repositories: &R,
    project: &Project,
    user_id: &UserId,
) -> Result<Project, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut new_project = project.clone();
    let now = Utc::now();
    new_project.created_at = now;
    new_project.updated_at = now;

    if new_project.id.to_string().trim().is_empty() {
        new_project.id = ProjectId::new();
    }

    repositories
        .projects()
        .save(&new_project, user_id, &now)
        .await?;

    Ok(new_project)
}

pub async fn get_project<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Option<Project>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories.projects().find_by_id(project_id).await?)
}

pub async fn list_projects<R>(repositories: &R) -> Result<Vec<Project>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories.projects().find_all().await?)
}

pub async fn search_projects<R>(
    repositories: &R,
    name: Option<&str>,
    status: Option<&ProjectStatus>,
    owner_id: Option<&str>,
    is_archived: Option<bool>,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<Vec<Project>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut projects = repositories.projects().find_all().await?;

    if let Some(name) = name {
        let name = name.trim().to_lowercase();
        if !name.is_empty() {
            projects.retain(|project| project.name.to_lowercase().contains(&name));
        }
    }

    if let Some(status) = status {
        projects.retain(|project| project.status.as_ref() == Some(status));
    }

    if let Some(owner_id) = owner_id {
        let owner_id = owner_id.trim();
        if !owner_id.is_empty() {
            projects.retain(|project| {
                project
                    .owner_id
                    .as_ref()
                    .is_some_and(|id| id.to_string() == owner_id)
            });
        }
    }

    if let Some(is_archived) = is_archived {
        projects.retain(|project| project.is_archived == is_archived);
    }

    let offset = offset.unwrap_or(0).max(0) as usize;
    let limit = limit.unwrap_or(i32::MAX).max(0) as usize;
    let projects = projects.into_iter().skip(offset).take(limit).collect();

    Ok(projects)
}

pub async fn update_project<R>(
    repositories: &R,
    project_id: &ProjectId,
    patch: &PartialProject,
    user_id: &UserId,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // パッチによる部分更新を実行
    let now = Utc::now();
    let changed = repositories
        .projects()
        .patch(project_id, patch, user_id, &now)
        .await?;
    Ok(changed)
}

pub async fn delete_project<R>(repositories: &R, project_id: &ProjectId) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories.projects().delete(project_id).await?;
    Ok(())
}
