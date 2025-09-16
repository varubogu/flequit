use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TaskId, UserId};
use flequit_types::errors::service_error::ServiceError;

/// TaskAssignmentサービス操作


pub async fn add_task_assignment<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _task_id: &TaskId,
    _user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "add_task_assignment is not implemented".to_string(),
    ))
}


pub async fn remove_task_assignment<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _task_id: &TaskId,
    _user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "remove_task_assignment is not implemented".to_string(),
    ))
}


pub async fn get_user_ids_by_task_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _task_id: &TaskId,
) -> Result<Vec<UserId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Ok(Vec::new()) // 一時的に空のベクタを返す
}


pub async fn get_task_ids_by_user_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _user_id: &UserId,
) -> Result<Vec<TaskId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Ok(Vec::new()) // 一時的に空のベクタを返す
}


pub async fn update_task_assignments<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _task_id: &TaskId,
    _user_ids: &[UserId],
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "update_task_assignments is not implemented".to_string(),
    ))
}


pub async fn remove_all_task_assignments_by_task_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _task_id: &TaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "remove_all_task_assignments_by_task_id is not implemented".to_string(),
    ))
}


pub async fn remove_all_task_assignments_by_user_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "remove_all_task_assignments_by_user_id is not implemented".to_string(),
    ))
}


pub async fn get_all_task_assignments<R>(
    _repositories: &R,
    _project_id: &ProjectId,
) -> Result<Vec<TaskAssignment>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Ok(Vec::new()) // 一時的に空のベクタを返す
}

/// SubtaskAssignmentサービス操作


pub async fn add_subtask_assignment<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _subtask_id: &SubTaskId,
    _user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "add_subtask_assignment is not implemented".to_string(),
    ))
}


pub async fn remove_subtask_assignment<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _subtask_id: &SubTaskId,
    _user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "remove_subtask_assignment is not implemented".to_string(),
    ))
}


pub async fn get_user_ids_by_subtask_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _subtask_id: &SubTaskId,
) -> Result<Vec<UserId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Ok(Vec::new()) // 一時的に空のベクタを返す
}


pub async fn get_subtask_ids_by_user_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _user_id: &UserId,
) -> Result<Vec<SubTaskId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Ok(Vec::new()) // 一時的に空のベクタを返す
}


pub async fn update_subtask_assignments<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _subtask_id: &SubTaskId,
    _user_ids: &[UserId],
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "update_subtask_assignments is not implemented".to_string(),
    ))
}


pub async fn remove_all_subtask_assignments_by_subtask_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _subtask_id: &SubTaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "remove_all_subtask_assignments_by_subtask_id is not implemented".to_string(),
    ))
}


pub async fn remove_all_subtask_assignments_by_user_id<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Err(ServiceError::InternalError(
        "remove_all_subtask_assignments_by_user_id is not implemented".to_string(),
    ))
}


pub async fn get_all_subtask_assignments<R>(
    _repositories: &R,
    _project_id: &ProjectId,
) -> Result<Vec<SubTaskAssignment>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // TODO: Infrastructure層にassignmentメソッドが実装されたら有効化
    Ok(Vec::new()) // 一時的に空のベクタを返す
}
