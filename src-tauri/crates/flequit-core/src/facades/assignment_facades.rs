use crate::services::assignment_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TaskId, UserId};
use flequit_types::errors::service_error::ServiceError;

/// TaskAssignment facades


pub async fn add_task_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::add_task_assignment(repositories, project_id, task_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add task assignment: {:?}", e)),
    }
}


pub async fn remove_task_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_task_assignment(repositories, project_id, task_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove task assignment: {:?}", e)),
    }
}


pub async fn get_user_ids_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Vec<UserId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_user_ids_by_task_id(repositories, project_id, task_id).await {
        Ok(user_ids) => Ok(user_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user IDs by task ID: {:?}", e)),
    }
}


pub async fn get_task_ids_by_user_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<Vec<TaskId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_task_ids_by_user_id(repositories, project_id, user_id).await {
        Ok(task_ids) => Ok(task_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task IDs by user ID: {:?}", e)),
    }
}


pub async fn update_task_assignments<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    user_ids: &[UserId],
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::update_task_assignments(repositories, project_id, task_id, user_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task assignments: {:?}", e)),
    }
}


pub async fn remove_all_task_assignments_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_task_assignments_by_task_id(repositories, project_id, task_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all task assignments by task ID: {:?}",
            e
        )),
    }
}


pub async fn remove_all_task_assignments_by_user_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_task_assignments_by_user_id(repositories, project_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all task assignments by user ID: {:?}",
            e
        )),
    }
}


pub async fn get_all_task_assignments<R>(repositories: &R, project_id: &ProjectId) -> Result<Vec<TaskAssignment>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_all_task_assignments(repositories, project_id).await {
        Ok(task_assignments) => Ok(task_assignments),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all task assignments: {:?}", e)),
    }
}

/// SubtaskAssignment facades


pub async fn add_subtask_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::add_subtask_assignment(repositories, project_id, subtask_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add subtask assignment: {:?}", e)),
    }
}


pub async fn remove_subtask_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_subtask_assignment(repositories, project_id, subtask_id, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove subtask assignment: {:?}", e)),
    }
}


pub async fn get_user_ids_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<Vec<UserId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_user_ids_by_subtask_id(repositories, project_id, subtask_id).await {
        Ok(user_ids) => Ok(user_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user IDs by subtask ID: {:?}", e)),
    }
}


pub async fn get_subtask_ids_by_user_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<Vec<SubTaskId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_subtask_ids_by_user_id(repositories, project_id, user_id).await {
        Ok(subtask_ids) => Ok(subtask_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask IDs by user ID: {:?}", e)),
    }
}


pub async fn update_subtask_assignments<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    user_ids: &[UserId],
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::update_subtask_assignments(repositories, project_id, subtask_id, user_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask assignments: {:?}", e)),
    }
}


pub async fn remove_all_subtask_assignments_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_subtask_assignments_by_subtask_id(repositories, project_id, subtask_id)
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


pub async fn remove_all_subtask_assignments_by_user_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::remove_all_subtask_assignments_by_user_id(repositories, project_id, user_id).await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all subtask assignments by user ID: {:?}",
            e
        )),
    }
}


pub async fn get_all_subtask_assignments<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<SubTaskAssignment>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match assignment_service::get_all_subtask_assignments(repositories, project_id).await {
        Ok(subtask_assignments) => Ok(subtask_assignments),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all subtask assignments: {:?}", e)),
    }
}
