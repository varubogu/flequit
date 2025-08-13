use log::info;

use crate::models::project::Project;
use crate::models::command::project::ProjectSearchRequest;
use crate::services::project_service::ProjectService;
use crate::services::repository_service::{get_repository_searcher, get_repositories};
use crate::errors::service_error::ServiceError;

pub async fn create_project(project: &Project) -> Result<bool, String> {
    let service = ProjectService;
    let mut repositories = get_repositories();

    match service.create_project(&mut repositories, project).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create project: {:?}", e))
    }
}

pub async fn get_project(id: &str) -> Result<Option<Project>, String> {
    let service = ProjectService;
    let repository = get_repository_searcher();

    match service.get_project(repository.as_ref(), id).await {
        Ok(Some(project)) => Ok(Some(project)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get project: {:?}", e))
    }
}

pub async fn update_project(project: &Project) -> Result<bool, String> {
    let service = ProjectService;
    let mut repositories = get_repositories();

    match service.update_project(&mut repositories, project).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update project: {:?}", e))
    }
}

pub async fn delete_project(id: &str) -> Result<bool, String> {
    // 実際にはサービス層を通してデータを削除する実装が必要
    info!("delete_project called with account: {:?}", id);
    Ok(true)
}

pub async fn search_projects(condition: &ProjectSearchRequest) -> Result<Vec<Project>, String> {
    let service = ProjectService;
    let repository = get_repository_searcher();

    match service.search_projects(repository.as_ref(), condition).await {
        Ok((projects, _)) => Ok(projects),
        Err(e) => Err(format!("Failed to search projects: {:?}", e))
    }
}
