use crate::services::subtask_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask::{PartialSubTask, SubTask};
use flequit_model::types::id_types::{ProjectId, SubTaskId};
use flequit_types::errors::service_error::ServiceError;

pub async fn create_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask: &SubTask,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::create_subtask(repositories, project_id, &subtask).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create subtask: {:?}", e)),
    }
}

pub async fn get_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &SubTaskId,
) -> Result<Option<SubTask>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::get_subtask(repositories, project_id, id).await {
        Ok(subtask) => Ok(subtask),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask: {:?}", e)),
    }
}

pub async fn update_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    patch: &PartialSubTask,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::update_subtask(repositories, project_id, subtask_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask: {:?}", e)),
    }
}

pub async fn delete_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &SubTaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::delete_subtask(repositories, project_id, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete subtask: {:?}", e)),
    }
}
