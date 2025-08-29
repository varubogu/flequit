use crate::errors::service_error::ServiceError;
use flequit_model::models::assignment::{TaskAssignment, SubtaskAssignment};
use flequit_model::types::id_types::{TaskId, SubTaskId, UserId};

/// TaskAssignmentサービス操作

#[tracing::instrument(level = "trace")]
pub async fn add_task_assignment(task_id: &TaskId, user_id: &UserId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_assignments.add_assignment(task_id, user_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_task_assignment(task_id: &TaskId, user_id: &UserId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_assignments.remove_assignment(task_id, user_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_user_ids_by_task_id(task_id: &TaskId) -> Result<Vec<UserId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let user_ids = sqlite_repos.task_assignments.find_user_ids_by_task_id(task_id).await?;
    Ok(user_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn get_task_ids_by_user_id(user_id: &UserId) -> Result<Vec<TaskId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let task_ids = sqlite_repos.task_assignments.find_task_ids_by_user_id(user_id).await?;
    Ok(task_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn update_task_assignments(task_id: &TaskId, user_ids: &[UserId]) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_assignments.remove_all_assignments_by_task_id(task_id).await?;
    
    for user_id in user_ids {
        sqlite_repos.task_assignments.add_assignment(task_id, user_id).await?;
    }
    
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_assignments_by_task_id(task_id: &TaskId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_assignments.remove_all_assignments_by_task_id(task_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_assignments_by_user_id(user_id: &UserId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.task_assignments.remove_all_assignments_by_user_id(user_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_task_assignments() -> Result<Vec<TaskAssignment>, ServiceError> {
    // TODO: SQLite実装からTaskAssignmentエンティティを直接取得する方法を実装
    // 一時的に空のベクタを返す
    Ok(Vec::new())
}

/// SubtaskAssignmentサービス操作

#[tracing::instrument(level = "trace")]
pub async fn add_subtask_assignment(subtask_id: &SubTaskId, user_id: &UserId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_assignments.add_assignment(subtask_id, user_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_subtask_assignment(subtask_id: &SubTaskId, user_id: &UserId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_assignments.remove_assignment(subtask_id, user_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_user_ids_by_subtask_id(subtask_id: &SubTaskId) -> Result<Vec<UserId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let user_ids = sqlite_repos.subtask_assignments.find_user_ids_by_subtask_id(subtask_id).await?;
    Ok(user_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn get_subtask_ids_by_user_id(user_id: &UserId) -> Result<Vec<SubTaskId>, ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    let subtask_ids = sqlite_repos.subtask_assignments.find_subtask_ids_by_user_id(user_id).await?;
    Ok(subtask_ids)
}

#[tracing::instrument(level = "trace")]
pub async fn update_subtask_assignments(subtask_id: &SubTaskId, user_ids: &[UserId]) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_assignments.remove_all_assignments_by_subtask_id(subtask_id).await?;
    
    for user_id in user_ids {
        sqlite_repos.subtask_assignments.add_assignment(subtask_id, user_id).await?;
    }
    
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_assignments_by_subtask_id(subtask_id: &SubTaskId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_assignments.remove_all_assignments_by_subtask_id(subtask_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_assignments_by_user_id(user_id: &UserId) -> Result<(), ServiceError> {
    let sqlite_repos = flequit_storage::infrastructure::local_sqlite::local_sqlite_repositories::LocalSqliteRepositories::new().await?;
    sqlite_repos.subtask_assignments.remove_all_assignments_by_user_id(user_id).await?;
    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_subtask_assignments() -> Result<Vec<SubtaskAssignment>, ServiceError> {
    // TODO: SQLite実装からSubtaskAssignmentエンティティを直接取得する方法を実装
    // 一時的に空のベクタを返す
    Ok(Vec::new())
}