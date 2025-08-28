use log::info;

use crate::errors::service_error::ServiceError;
use flequit_model::models::task::{PartialTask, Task};
use crate::services::task_service;
use flequit_model::types::id_types::TaskId;

#[tracing::instrument]
pub async fn create_task(task: &Task) -> Result<bool, String> {
    match task_service::create_task(task).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn get_task(id: &TaskId) -> Result<Option<Task>, String> {
    info!("get_task called with id: {}", id);
    match task_service::get_task(id).await {
        Ok(t) => Ok(t),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn update_task(task_id: &TaskId, patch: &PartialTask) -> Result<bool, String> {
    match task_service::update_task(task_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn delete_task(id: &TaskId) -> Result<bool, String> {
    match task_service::delete_task(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}
