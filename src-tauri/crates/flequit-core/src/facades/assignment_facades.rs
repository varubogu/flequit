use crate::services::assignment_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{SubTaskId, TaskId, UserId};
use flequit_types::errors::service_error::ServiceError;

/// TaskAssignment facades

#[tracing::instrument(level = "trace")]
pub async fn add_task_assignment<R>(
    repositories: &R,
    task_id: &TaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::add_task_assignment(repositories, task_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add task assignment: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_task_assignment<R>(
    repositories: &R,
    task_id: &TaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_task_assignment(repositories, task_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove task assignment: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_user_ids_by_task_id<R>(
    repositories: &R,
    task_id: &TaskId,
) -> Result<Vec<UserId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_user_ids_by_task_id(repositories, task_id).await {
        Ok(user_ids) => Ok(user_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user IDs by task ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_task_ids_by_user_id<R>(
    repositories: &R,
    user_id: &UserId,
) -> Result<Vec<TaskId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_task_ids_by_user_id(repositories, user_id).await {
        Ok(task_ids) => Ok(task_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task IDs by user ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_task_assignments<R>(
    repositories: &R,
    task_id: &TaskId,
    user_ids: &[UserId],
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::update_task_assignments(repositories, task_id, user_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task assignments: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_assignments_by_task_id<R>(
    repositories: &R,
    task_id: &TaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_task_assignments_by_task_id(repositories, task_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all task assignments by task ID: {:?}",
            e
        )),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_assignments_by_user_id<R>(
    repositories: &R,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_task_assignments_by_user_id(repositories, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all task assignments by user ID: {:?}",
            e
        )),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_task_assignments<R>(repositories: &R) -> Result<Vec<TaskAssignment>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_all_task_assignments(repositories).await {
        Ok(task_assignments) => Ok(task_assignments),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all task assignments: {:?}", e)),
    }
}

/// SubtaskAssignment facades

#[tracing::instrument(level = "trace")]
pub async fn add_subtask_assignment<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::add_subtask_assignment(repositories, subtask_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add subtask assignment: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_subtask_assignment<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_subtask_assignment(repositories, subtask_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove subtask assignment: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_user_ids_by_subtask_id<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
) -> Result<Vec<UserId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_user_ids_by_subtask_id(repositories, subtask_id).await {
        Ok(user_ids) => Ok(user_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user IDs by subtask ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_subtask_ids_by_user_id<R>(
    repositories: &R,
    user_id: &UserId,
) -> Result<Vec<SubTaskId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_subtask_ids_by_user_id(repositories, user_id).await {
        Ok(subtask_ids) => Ok(subtask_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask IDs by user ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_subtask_assignments<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
    user_ids: &[UserId],
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::update_subtask_assignments(repositories, subtask_id, user_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask assignments: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_assignments_by_subtask_id<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_subtask_assignments_by_subtask_id(repositories, subtask_id)
        .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all subtask assignments by subtask ID: {:?}",
            e
        )),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_assignments_by_user_id<R>(
    repositories: &R,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_subtask_assignments_by_user_id(repositories, user_id).await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all subtask assignments by user ID: {:?}",
            e
        )),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_subtask_assignments<R>(
    repositories: &R,
) -> Result<Vec<SubTaskAssignment>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_all_subtask_assignments(repositories).await {
        Ok(subtask_assignments) => Ok(subtask_assignments),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all subtask assignments: {:?}", e)),
    }
}
