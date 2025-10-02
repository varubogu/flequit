use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId};
use flequit_repository::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;

pub async fn add_subtask_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    repositories
        .subtask_tags()
        .add(&actual_project_id, subtask_id, tag_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(())
}

pub async fn remove_subtask_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_id: &TagId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    repositories
        .subtask_tags()
        .remove(&actual_project_id, subtask_id, tag_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(())
}

pub async fn get_tag_ids_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<Vec<TagId>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    let subtask_tags = repositories
        .subtask_tags()
        .find_relations(&actual_project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(subtask_tags.into_iter().map(|t| t.tag_id).collect())
}

pub async fn get_subtask_ids_by_tag_id<R>(
    repositories: &R,
    _project_id: &ProjectId,
    tag_id: &TagId,
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
        let subtask_tags = repositories
            .subtask_tags()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        for subtask_tag in subtask_tags {
            if subtask_tag.tag_id == *tag_id {
                subtask_ids.push(subtask_tag.subtask_id);
            }
        }
    }
    Ok(subtask_ids)
}

pub async fn update_subtask_tag_relations<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_ids: &[TagId],
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let actual_project_id =
        find_project_id_by_subtask_id(repositories, project_id, subtask_id).await?;
    repositories
        .subtask_tags()
        .remove_all(&actual_project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)?;
    for tag_id in tag_ids {
        repositories
            .subtask_tags()
            .add(&actual_project_id, subtask_id, tag_id)
            .await
            .map_err(ServiceError::Repository)?;
    }
    Ok(())
}

pub async fn remove_all_subtask_tags_by_subtask_id<R>(
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
        .subtask_tags()
        .remove_all(&actual_project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(())
}

pub async fn remove_all_subtask_tags_by_tag_id<R>(
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
        let subtask_tags = repositories
            .subtask_tags()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        for subtask_tag in subtask_tags {
            if subtask_tag.tag_id == *tag_id {
                repositories
                    .subtask_tags()
                    .remove(&project.id, &subtask_tag.subtask_id, tag_id)
                    .await
                    .map_err(ServiceError::Repository)?;
            }
        }
    }
    Ok(())
}

pub async fn get_all_subtask_tags<R>(
    repositories: &R,
    _project_id: &ProjectId,
) -> Result<Vec<SubTaskTag>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let projects = repositories
        .projects()
        .find_all()
        .await
        .map_err(ServiceError::Repository)?;
    let mut all_subtask_tags = Vec::new();
    for project in projects {
        let subtask_tags = repositories
            .subtask_tags()
            .find_all(&project.id)
            .await
            .map_err(ServiceError::Repository)?;
        all_subtask_tags.extend(subtask_tags);
    }
    Ok(all_subtask_tags)
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
        if subtasks.iter().any(|s| s.id == *subtask_id) {
            return Ok(project.id);
        }
    }
    Err(ServiceError::ValidationError(format!(
        "SubTask with ID {} not found in any project",
        subtask_id
    )))
}
