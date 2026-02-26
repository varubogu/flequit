use chrono::Utc;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;

pub async fn add_subtask_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    user_id: &UserId,
    updating_user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    let now = Utc::now();
    repositories
        .subtask_assignments()
        .add(&actual_project_id, subtask_id, user_id, updating_user_id, &now)
        .await
        .map_err(ServiceError::Repository)
}

pub async fn remove_subtask_assignment<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    repositories
        .subtask_assignments()
        .remove(&actual_project_id, subtask_id, user_id)
        .await
        .map_err(ServiceError::Repository)
}

pub async fn get_user_ids_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<Vec<UserId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    let assignments = repositories
        .subtask_assignments()
        .find_relations(&actual_project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(assignments.into_iter().map(|a| a.user_id).collect())
}

pub async fn get_subtask_ids_by_user_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    user_id: &UserId,
) -> Result<Vec<SubTaskId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let projects = repositories
        .projects()
        .find_all()
        .await
        .map_err(ServiceError::Repository)?;

    let mut subtask_ids = Vec::new();
    for project in projects {
        let all_assignments = repositories
            .subtask_assignments()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        for assignment in all_assignments {
            if assignment.user_id == *user_id {
                subtask_ids.push(assignment.subtask_id);
            }
        }
    }
    Ok(subtask_ids)
}

pub async fn update_subtask_assignments<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    user_ids: &[UserId],
    updating_user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    repositories
        .subtask_assignments()
        .remove_all(&actual_project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)?;
    let now = Utc::now();
    for uid in user_ids {
        repositories
            .subtask_assignments()
            .add(&actual_project_id, subtask_id, uid, updating_user_id, &now)
            .await
            .map_err(ServiceError::Repository)?;
    }
    Ok(())
}

pub async fn remove_all_subtask_assignments_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    repositories
        .subtask_assignments()
        .remove_all(&actual_project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)
}

pub async fn remove_all_subtask_assignments_by_user_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let subtasks = repositories
        .sub_tasks()
        .find_all(project_id)
        .await
        .map_err(ServiceError::Repository)?;
    for subtask in subtasks {
        repositories
            .subtask_assignments()
            .remove(project_id, &subtask.id, user_id)
            .await
            .map_err(ServiceError::Repository)?;
    }
    Ok(())
}

pub async fn get_all_subtask_assignments<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<SubTaskAssignment>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .subtask_assignments()
        .find_all(project_id)
        .await
        .map_err(ServiceError::Repository)
}

async fn find_project_id_by_subtask_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    subtask_id: &SubTaskId,
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
        let subtasks = repositories
            .sub_tasks()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        if subtasks.iter().any(|subtask| subtask.id == *subtask_id) {
            return Ok(project.id);
        }
    }
    Err(ServiceError::ValidationError(format!(
        "SubTask with ID {} not found in any project",
        subtask_id
    )))
}
