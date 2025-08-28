use flequit_model::models::subtask::{PartialSubTask, SubTask};
use flequit_model::types::id_types::SubTaskId;
use crate::errors::service_error::ServiceError;
use crate::services::subtask_service;

#[tracing::instrument]
pub async fn create_sub_task(subtask: &SubTask) -> Result<bool, String> {
    match subtask_service::create_subtask(&subtask).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create subtask: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn get_sub_task(id: &SubTaskId) -> Result<Option<SubTask>, String> {
    match subtask_service::get_subtask(id).await {
        Ok(subtask) => Ok(subtask),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn update_sub_task(
    subtask_id: &SubTaskId,
    patch: &PartialSubTask,
) -> Result<bool, String> {
    match subtask_service::update_subtask(subtask_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn delete_sub_task(id: &SubTaskId) -> Result<bool, String> {
    match subtask_service::delete_subtask(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete subtask: {:?}", e)),
    }
}
