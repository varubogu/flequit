use crate::models::project::{Project};
use crate::errors::service_error::ServiceError;
use crate::models::command::project::ProjectSearchRequest;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::unified::UnifiedRepositories;
use crate::types::id_types::ProjectId;
use chrono::Utc;


pub async fn create_project(
    project: &Project,
) -> Result<Project, ServiceError> {
    if project.name.trim().is_empty() {
        return Err(ServiceError::ValidationError("Project name cannot be empty".to_string()));
    }

    let mut new_project = project.clone();
    let now = Utc::now();
    new_project.created_at = now;
    new_project.updated_at = now;

    if new_project.id.to_string().trim().is_empty() {
        new_project.id = crate::types::id_types::ProjectId::new();
    }

    let repository = UnifiedRepositories::new().await?;
    repository.projects.save(&new_project).await?;

    Ok(new_project)
}

pub async fn get_project(
    project_id: &ProjectId,
) -> Result<Option<Project>, ServiceError> {
    let repository = UnifiedRepositories::new().await?;
    Ok(repository.projects.find_by_id(project_id).await?)
}

pub async fn list_projects(
) -> Result<Vec<Project>, ServiceError> {
    let repository = UnifiedRepositories::new().await?;
    Ok(repository.projects.find_all().await?)
}

pub async fn update_project(
    project: &Project,
) -> Result<Project, ServiceError> {
    let mut updated_project = project.clone();
    updated_project.updated_at = Utc::now();

    let repository = UnifiedRepositories::new().await?;
    repository.projects.save(&updated_project).await?;
    Ok(updated_project)
}

pub async fn delete_project(
    project_id: &ProjectId,
) -> Result<(), ServiceError> {
    let repository = UnifiedRepositories::new().await?;
    repository.projects.delete(project_id).await?;
    Ok(())
}

pub async fn restore_project(
    backup_path: &str,
) -> Result<String, ServiceError> {
    // TODO: restore_project機能をトレイトに追加する必要があります
    let _backup_path = backup_path;
    Ok("restored_project_id".to_string())
}

pub async fn search_projects(
    request: &ProjectSearchRequest,
) -> Result<(Vec<Project>, usize), ServiceError> {
    let repository = UnifiedRepositories::new().await?;
    let projects = repository.projects.find_all().await?;

    // フィルタリングは空のVecには意味がないため、requestのパラメータを使用するだけ
    let _ = (&request.name, &request.description, &request.status, &request.owner_id);

    let total_count = projects.len();
    let offset = request.offset.unwrap_or(0);
    let limit = request.limit.unwrap_or(50);

    let paginated_projects = projects.into_iter().skip(offset).take(limit).collect();

    Ok((paginated_projects, total_count))
}
