use log::info;

use crate::services::{tag_service, task_service, task_tag_service};
use chrono::Utc;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::models::task_projects::task::{PartialTask, Task};
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId};
use flequit_types::errors::service_error::ServiceError;
use uuid::Uuid;

pub async fn create_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task: &Task,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_service::create_task(repositories, project_id, task).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task: {:?}", e)),
    }
}

pub async fn get_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskId,
) -> Result<Option<Task>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    info!("get_task called with id: {}", id);
    match task_service::get_task(repositories, project_id, id).await {
        Ok(t) => Ok(t),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

pub async fn update_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    patch: &PartialTask,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_service::update_task(repositories, project_id, task_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

pub async fn delete_task<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_service::delete_task(repositories, project_id, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}

/// TaskTag facades (moved from tagging_facades.rs)

pub async fn add_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::add_task_tag_relation(repositories, project_id, task_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add task-tag relation: {:?}", e)),
    }
}

// 名前から作成/取得し、紐づけを原子的に行う
pub async fn add_task_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_name: &str,
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
        let now = Utc::now();
        let new_tag = Tag {
            id: TagId::from(Uuid::new_v4()),
            name: tag_name.to_string(),
            color: None,
            order_index: None,
            created_at: now,
            updated_at: now,
        };
        match tag_service::create_tag(repositories, project_id, &new_tag).await {
            Ok(_) => new_tag,
            Err(ServiceError::ValidationError(msg)) => return Err(msg),
            Err(e) => return Err(format!("Failed to create tag: {:?}", e)),
        }
    };

    // 3) 関連付け
    match task_tag_service::add_task_tag_relation(repositories, project_id, task_id, &tag.id).await
    {
        Ok(_) => Ok(tag),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add task-tag relation: {:?}", e)),
    }
}

pub async fn remove_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::remove_task_tag_relation(repositories, project_id, task_id, tag_id)
        .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove task-tag relation: {:?}", e)),
    }
}

pub async fn get_tag_ids_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Vec<TagId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::get_tag_ids_by_task_id(repositories, project_id, task_id).await {
        Ok(tag_ids) => Ok(tag_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag IDs by task ID: {:?}", e)),
    }
}

pub async fn get_task_ids_by_tag_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<Vec<TaskId>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::get_task_ids_by_tag_id(repositories, project_id, tag_id).await {
        Ok(task_ids) => Ok(task_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task IDs by tag ID: {:?}", e)),
    }
}

pub async fn update_task_tag_relations<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_ids: &[TagId],
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::update_task_tag_relations(repositories, project_id, task_id, tag_ids)
        .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task-tag relations: {:?}", e)),
    }
}

pub async fn remove_all_task_tags_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::remove_all_task_tags_by_task_id(repositories, project_id, task_id).await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all task tags by task ID: {:?}",
            e
        )),
    }
}

pub async fn remove_all_task_tags_by_tag_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::remove_all_task_tags_by_tag_id(repositories, project_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove all task tags by tag ID: {:?}", e)),
    }
}

pub async fn get_all_task_tags<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<TaskTag>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match task_tag_service::get_all_task_tags(repositories, project_id).await {
        Ok(task_tags) => Ok(task_tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all task tags: {:?}", e)),
    }
}
