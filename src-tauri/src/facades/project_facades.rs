
use crate::models::project::Project;
use crate::models::command::project::ProjectSearchRequest;
use crate::services::project_service::ProjectService;
use crate::errors::service_error::ServiceError;

pub async fn create_project(project: &Project) -> Result<bool, String> {
    let service = match ProjectService::with_default_repository().await {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to create service: {:?}", e)),
    };

    match service.create_project(project).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create project: {:?}", e))
    }
}

pub async fn get_project(id: &str) -> Result<Option<Project>, String> {
    let service = match ProjectService::with_default_repository().await {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to create service: {:?}", e)),
    };

    match service.get_project(id).await {
        Ok(Some(project)) => Ok(Some(project)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get project: {:?}", e))
    }
}

pub async fn update_project(project: &Project) -> Result<bool, String> {
    let service = match ProjectService::with_default_repository().await {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to create service: {:?}", e)),
    };

    match service.update_project(project).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update project: {:?}", e))
    }
}

pub async fn delete_project(id: &str) -> Result<bool, String> {
    let service = match ProjectService::with_default_repository().await {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to create service: {:?}", e)),
    };

    match service.delete_project(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete project: {:?}", e))
    }
}

pub async fn search_projects(condition: &ProjectSearchRequest) -> Result<Vec<Project>, String> {
    let service = match ProjectService::with_default_repository().await {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to create service: {:?}", e)),
    };

    match service.search_projects(condition).await {
        Ok((projects, _)) => Ok(projects),
        Err(e) => Err(format!("Failed to search projects: {:?}", e))
    }
}
