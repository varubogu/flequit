use crate::services::task_list_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::task_list::{PartialTaskList, TaskList};
use flequit_model::types::id_types::{ProjectId, TaskListId};
use flequit_types::errors::service_error::ServiceError;

#[tracing::instrument]
pub async fn create_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_list: &TaskList,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::create_task_list(repositories, project_id, task_list).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task list: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn get_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskListId,
) -> Result<Option<TaskList>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::get_task_list(repositories, project_id, id).await {
        Ok(task_list) => Ok(task_list),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task list: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn update_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_list_id: &TaskListId,
    patch: &PartialTaskList,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::update_task_list(repositories, project_id, task_list_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task list: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn delete_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskListId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_list_service::delete_task_list(repositories, project_id, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete task list: {:?}", e)),
    }
}
