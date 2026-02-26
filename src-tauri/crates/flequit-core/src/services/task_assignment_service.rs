use chrono::Utc;
use crate::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;

pub async fn add_task_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    user_id: &UserId,
    updating_user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    let now = Utc::now();
    repositories
        .task_assignments()
        .add(&actual_project_id, task_id, user_id, updating_user_id, &now)
        .await
        .map_err(ServiceError::Repository)
}

pub async fn remove_task_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    repositories
        .task_assignments()
        .remove(&actual_project_id, task_id, user_id)
        .await
        .map_err(ServiceError::Repository)
}

pub async fn get_user_ids_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Vec<UserId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    let assignments = repositories
        .task_assignments()
        .find_relations(&actual_project_id, task_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(assignments.into_iter().map(|a| a.user_id).collect())
}

pub async fn get_task_ids_by_user_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    user_id: &UserId,
) -> Result<Vec<TaskId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let projects = repositories
        .projects()
        .find_all()
        .await
        .map_err(ServiceError::Repository)?;

    let mut task_ids = Vec::new();
    for project in projects {
        let all_assignments = repositories
            .task_assignments()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        for assignment in all_assignments {
            if assignment.user_id == *user_id {
                task_ids.push(assignment.task_id);
            }
        }
    }
    Ok(task_ids)
}

pub async fn update_task_assignments<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    user_ids: &[UserId],
    updating_user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    repositories
        .task_assignments()
        .remove_all(&actual_project_id, task_id)
        .await
        .map_err(ServiceError::Repository)?;
    let now = Utc::now();
    for uid in user_ids {
        repositories
            .task_assignments()
            .add(&actual_project_id, task_id, uid, updating_user_id, &now)
            .await
            .map_err(ServiceError::Repository)?;
    }
    Ok(())
}

pub async fn remove_all_task_assignments_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    repositories
        .task_assignments()
        .remove_all(&actual_project_id, task_id)
        .await
        .map_err(ServiceError::Repository)
}

pub async fn remove_all_task_assignments_by_user_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let tasks = repositories
        .tasks()
        .find_all(project_id)
        .await
        .map_err(ServiceError::Repository)?;
    for task in tasks {
        repositories
            .task_assignments()
            .remove(project_id, &task.id, user_id)
            .await
            .map_err(ServiceError::Repository)?;
    }
    Ok(())
}

pub async fn get_all_task_assignments<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<TaskAssignment>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .task_assignments()
        .find_all(project_id)
        .await
        .map_err(ServiceError::Repository)
}

async fn find_project_id_by_task_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<ProjectId, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let projects = repositories
        .projects()
        .find_all()
        .await
        .map_err(ServiceError::Repository)?;
    for project in projects {
        let tasks = repositories
            .tasks()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        if tasks.iter().any(|task| task.id == *task_id) {
            return Ok(project.id);
        }
    }
    Err(ServiceError::ValidationError(format!(
        "Task with ID {} not found in any project",
        task_id
    )))
}
