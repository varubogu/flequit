use crate::services::{subtask_service, subtask_tag_service, tag_service};
use crate::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::subtask::{PartialSubTask, SubTask};
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId, UserId};
use flequit_types::errors::service_error::ServiceError;

pub async fn create_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask: &SubTask,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::create_subtask(repositories, project_id, subtask, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create subtask: {:?}", e)),
    }
}

pub async fn get_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &SubTaskId,
) -> Result<Option<SubTask>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::get_subtask(repositories, project_id, id).await {
        Ok(subtask) => Ok(subtask),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask: {:?}", e)),
    }
}

pub async fn search_sub_tasks<R>(
    repositories: &R,
    project_id: &ProjectId,
    condition: &subtask_service::SubtaskSearchCondition,
) -> Result<Vec<SubTask>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::search_subtasks(repositories, project_id, condition).await {
        Ok(subtasks) => Ok(subtasks),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to search subtasks: {:?}", e)),
    }
}

pub async fn update_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    patch: &PartialSubTask,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::update_subtask(repositories, project_id, subtask_id, patch, user_id)
        .await
    {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask: {:?}", e)),
    }
}

pub async fn delete_sub_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &SubTaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_service::delete_subtask(repositories, project_id, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete subtask: {:?}", e)),
    }
}

/// SubtaskTag facades (moved from tagging_facades.rs)
pub async fn add_subtask_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_id: &TagId,
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::add_subtask_tag_relation(
        repositories,
        project_id,
        subtask_id,
        tag_id,
        user_id,
    )
    .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add subtask-tag relation: {:?}", e)),
    }
}

pub async fn add_subtask_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_name: &str,
    user_id: &UserId,
) -> Result<Tag, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 1) 既存タグ検索（完全一致）
    let existing = match tag_service::list_tags(repositories, project_id).await {
        Ok(all) => all.into_iter().find(|t| t.name == tag_name),
        Err(ServiceError::ValidationError(msg)) => return Err(msg),
        Err(e) => return Err(format!("Failed to list tags: {:?}", e)),
    };

    // 2) 無ければ作成
    let tag: Tag = if let Some(existing_tag) = existing {
        existing_tag
    } else {
        use uuid::Uuid;
        let now = chrono::Utc::now();
        let new_tag = Tag {
            id: TagId::from(Uuid::new_v4()),
            name: tag_name.to_string(),
            color: None,
            order_index: None,
            created_at: now,
            updated_at: now,
            deleted: false,
            updated_by: *user_id,
        };
        match tag_service::create_tag(repositories, project_id, &new_tag, user_id).await {
            Ok(_) => new_tag,
            Err(ServiceError::ValidationError(msg)) => return Err(msg),
            Err(e) => return Err(format!("Failed to create tag: {:?}", e)),
        }
    };

    // 3) 関連付け
    match subtask_tag_service::add_subtask_tag_relation(
        repositories,
        project_id,
        subtask_id,
        &tag.id,
        user_id,
    )
    .await
    {
        Ok(_) => Ok(tag),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add subtask-tag relation: {:?}", e)),
    }
}

pub async fn remove_subtask_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::remove_subtask_tag_relation(
        repositories,
        project_id,
        subtask_id,
        tag_id,
    )
    .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove subtask-tag relation: {:?}", e)),
    }
}

pub async fn get_tag_ids_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<Vec<TagId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::get_tag_ids_by_subtask_id(repositories, project_id, subtask_id).await
    {
        Ok(tag_ids) => Ok(tag_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag IDs by subtask ID: {:?}", e)),
    }
}

pub async fn get_subtask_ids_by_tag_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<Vec<SubTaskId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::get_subtask_ids_by_tag_id(repositories, project_id, tag_id).await {
        Ok(subtask_ids) => Ok(subtask_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask IDs by tag ID: {:?}", e)),
    }
}

pub async fn update_subtask_tag_relations<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_ids: &[TagId],
    user_id: &UserId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::update_subtask_tag_relations(
        repositories,
        project_id,
        subtask_id,
        tag_ids,
        user_id,
    )
    .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask-tag relations: {:?}", e)),
    }
}

pub async fn remove_all_subtask_tags_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::remove_all_subtask_tags_by_subtask_id(
        repositories,
        project_id,
        subtask_id,
    )
    .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all subtask tags by subtask ID: {:?}",
            e
        )),
    }
}

pub async fn remove_all_subtask_tags_by_tag_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::remove_all_subtask_tags_by_tag_id(repositories, project_id, tag_id)
        .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all subtask tags by tag ID: {:?}",
            e
        )),
    }
}

pub async fn get_all_subtask_tags<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<SubTaskTag>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match subtask_tag_service::get_all_subtask_tags(repositories, project_id).await {
        Ok(subtask_tags) => Ok(subtask_tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all subtask tags: {:?}", e)),
    }
}
