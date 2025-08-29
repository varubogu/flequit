use flequit_model::models::tagging::{TaskTag, SubtaskTag};
use flequit_model::types::id_types::{TaskId, SubTaskId, TagId};
use crate::errors::service_error::ServiceError;
use crate::services::tagging_service;

/// TaskTag facades

#[tracing::instrument(level = "trace")]
pub async fn add_task_tag_relation(task_id: &TaskId, tag_id: &TagId) -> Result<bool, String> {
    match tagging_service::add_task_tag_relation(task_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add task-tag relation: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_task_tag_relation(task_id: &TaskId, tag_id: &TagId) -> Result<bool, String> {
    match tagging_service::remove_task_tag_relation(task_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove task-tag relation: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag_ids_by_task_id(task_id: &TaskId) -> Result<Vec<TagId>, String> {
    match tagging_service::get_tag_ids_by_task_id(task_id).await {
        Ok(tag_ids) => Ok(tag_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag IDs by task ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_task_ids_by_tag_id(tag_id: &TagId) -> Result<Vec<TaskId>, String> {
    match tagging_service::get_task_ids_by_tag_id(tag_id).await {
        Ok(task_ids) => Ok(task_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task IDs by tag ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_task_tag_relations(task_id: &TaskId, tag_ids: &[TagId]) -> Result<bool, String> {
    match tagging_service::update_task_tag_relations(task_id, tag_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task-tag relations: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_tags_by_task_id(task_id: &TaskId) -> Result<bool, String> {
    match tagging_service::remove_all_task_tags_by_task_id(task_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove all task tags by task ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_task_tags_by_tag_id(tag_id: &TagId) -> Result<bool, String> {
    match tagging_service::remove_all_task_tags_by_tag_id(tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove all task tags by tag ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_task_tags() -> Result<Vec<TaskTag>, String> {
    match tagging_service::get_all_task_tags().await {
        Ok(task_tags) => Ok(task_tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all task tags: {:?}", e)),
    }
}

/// SubtaskTag facades

#[tracing::instrument(level = "trace")]
pub async fn add_subtask_tag_relation(subtask_id: &SubTaskId, tag_id: &TagId) -> Result<bool, String> {
    match tagging_service::add_subtask_tag_relation(subtask_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to add subtask-tag relation: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_subtask_tag_relation(subtask_id: &SubTaskId, tag_id: &TagId) -> Result<bool, String> {
    match tagging_service::remove_subtask_tag_relation(subtask_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove subtask-tag relation: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_tag_ids_by_subtask_id(subtask_id: &SubTaskId) -> Result<Vec<TagId>, String> {
    match tagging_service::get_tag_ids_by_subtask_id(subtask_id).await {
        Ok(tag_ids) => Ok(tag_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag IDs by subtask ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_subtask_ids_by_tag_id(tag_id: &TagId) -> Result<Vec<SubTaskId>, String> {
    match tagging_service::get_subtask_ids_by_tag_id(tag_id).await {
        Ok(subtask_ids) => Ok(subtask_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask IDs by tag ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_subtask_tag_relations(subtask_id: &SubTaskId, tag_ids: &[TagId]) -> Result<bool, String> {
    match tagging_service::update_subtask_tag_relations(subtask_id, tag_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask-tag relations: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_tags_by_subtask_id(subtask_id: &SubTaskId) -> Result<bool, String> {
    match tagging_service::remove_all_subtask_tags_by_subtask_id(subtask_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove all subtask tags by subtask ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn remove_all_subtask_tags_by_tag_id(tag_id: &TagId) -> Result<bool, String> {
    match tagging_service::remove_all_subtask_tags_by_tag_id(tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove all subtask tags by tag ID: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_all_subtask_tags() -> Result<Vec<SubtaskTag>, String> {
    match tagging_service::get_all_subtask_tags().await {
        Ok(subtask_tags) => Ok(subtask_tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all subtask tags: {:?}", e)),
    }
}