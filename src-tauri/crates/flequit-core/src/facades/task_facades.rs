use log::info;

use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::task_projects::task::{PartialTask, Task};
use crate::services::task_service;
use flequit_model::types::id_types::{TaskId, ProjectId};
use flequit_infrastructure::InfrastructureRepositories;

#[tracing::instrument]
pub async fn create_task(project_id: &ProjectId, task: &Task) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match task_service::create_task(&repositories, project_id, task).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn get_task(project_id: &ProjectId, id: &TaskId) -> Result<Option<Task>, String> {
    info!("get_task called with id: {}", id);
    let repositories = InfrastructureRepositories::instance().await;
    match task_service::get_task(&repositories, project_id, id).await {
        Ok(t) => Ok(t),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn update_task(project_id: &ProjectId, task_id: &TaskId, patch: &PartialTask) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match task_service::update_task(&repositories, project_id, task_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn delete_task(project_id: &ProjectId, id: &TaskId) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match task_service::delete_task(&repositories, project_id, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}
