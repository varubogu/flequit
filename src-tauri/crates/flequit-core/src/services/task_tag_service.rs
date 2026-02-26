use chrono::Utc;
use crate::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, UserId};
use flequit_repository::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;

pub async fn add_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    repositories
        .task_tags()
        .add(&actual_project_id, task_id, tag_id, user_id, &Utc::now())
        .await
        .map_err(ServiceError::Repository)?;
    Ok(())
}

pub async fn remove_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    repositories
        .task_tags()
        .remove(&actual_project_id, task_id, tag_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(())
}

pub async fn get_tag_ids_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Vec<TagId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let tag_ids = repositories
        .task_tags()
        .find_relations(project_id, task_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(tag_ids.into_iter().map(|t| t.tag_id).collect())
}

pub async fn get_task_ids_by_tag_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    tag_id: &TagId,
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
        let task_tags = repositories
            .task_tags()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        for task_tag in task_tags {
            if task_tag.tag_id == *tag_id {
                task_ids.push(task_tag.task_id);
            }
        }
    }
    Ok(task_ids)
}

pub async fn update_task_tag_relations<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_ids: &[TagId],
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    repositories
        .task_tags()
        .remove_all(&actual_project_id, task_id)
        .await
        .map_err(ServiceError::Repository)?;
    let now = Utc::now();
    for tag_id in tag_ids {
        repositories
            .task_tags()
            .add(&actual_project_id, task_id, tag_id, user_id, &now)
            .await
            .map_err(ServiceError::Repository)?;
    }
    Ok(())
}

pub async fn remove_all_task_tags_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id = find_project_id_by_task_id(repositories, project_id, task_id).await?;
    repositories
        .task_tags()
        .remove_all(&actual_project_id, task_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(())
}

pub async fn remove_all_task_tags_by_tag_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let projects = repositories
        .projects()
        .find_all()
        .await
        .map_err(ServiceError::Repository)?;
    for project in projects {
        let task_tags = repositories
            .task_tags()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        for task_tag in task_tags {
            if task_tag.tag_id == *tag_id {
                repositories
                    .task_tags()
                    .remove(&project.id, &task_tag.task_id, tag_id)
                    .await
                    .map_err(ServiceError::Repository)?;
            }
        }
    }
    Ok(())
}

pub async fn get_all_task_tags<R>(
    repositories: &R,
    _project_id: &ProjectId,
) -> Result<Vec<TaskTag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let projects = repositories
        .projects()
        .find_all()
        .await
        .map_err(ServiceError::Repository)?;
    let mut all_task_tags = Vec::new();
    for project in projects {
        let task_tags = repositories
            .task_tags()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        all_task_tags.extend(task_tags);
    }
    Ok(all_task_tags)
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
