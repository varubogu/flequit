use crate::services::tagging_service;
use flequit_infrastructure::{InfrastructureRepositories, InfrastructureRepositoriesTrait};
use flequit_model::models::task_projects::{subtask_tag::SubTaskTag, task_tag::TaskTag};
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId, TaskId};
use flequit_types::errors::service_error::ServiceError;

/// TaskTag facades


pub async fn add_task_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tagging_service::add_task_tag_relation(repositories, project_id, task_id, tag_id).await {
        Ok(_) => Ok(true),
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
    match tagging_service::remove_task_tag_relation(repositories, project_id, task_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove task-tag relation: {:?}", e)),
    }
}


pub async fn get_tag_ids_by_task_id(project_id: &ProjectId, task_id: &TaskId) -> Result<Vec<TagId>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::get_tag_ids_by_task_id(&repositories, project_id, task_id).await {
        Ok(tag_ids) => Ok(tag_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag IDs by task ID: {:?}", e)),
    }
}


pub async fn get_task_ids_by_tag_id(project_id: &ProjectId, tag_id: &TagId) -> Result<Vec<TaskId>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::get_task_ids_by_tag_id(&repositories, project_id, tag_id).await {
        Ok(task_ids) => Ok(task_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get task IDs by tag ID: {:?}", e)),
    }
}


pub async fn update_task_tag_relations(
    project_id: &ProjectId,
    task_id: &TaskId,
    tag_ids: &[TagId],
) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::update_task_tag_relations(&repositories, project_id, task_id, tag_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task-tag relations: {:?}", e)),
    }
}


pub async fn remove_all_task_tags_by_task_id(project_id: &ProjectId, task_id: &TaskId) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::remove_all_task_tags_by_task_id(&repositories, project_id, task_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all task tags by task ID: {:?}",
            e
        )),
    }
}


pub async fn remove_all_task_tags_by_tag_id(project_id: &ProjectId, tag_id: &TagId) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::remove_all_task_tags_by_tag_id(&repositories, project_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove all task tags by tag ID: {:?}", e)),
    }
}


pub async fn get_all_task_tags(project_id: &ProjectId) -> Result<Vec<TaskTag>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::get_all_task_tags(&repositories, project_id).await {
        Ok(task_tags) => Ok(task_tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all task tags: {:?}", e)),
    }
}

/// SubtaskTag facades


pub async fn add_subtask_tag_relation<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tagging_service::add_subtask_tag_relation(repositories, project_id, subtask_id, tag_id).await {
        Ok(_) => Ok(true),
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
    match tagging_service::remove_subtask_tag_relation(repositories, project_id, subtask_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to remove subtask-tag relation: {:?}", e)),
    }
}


pub async fn get_tag_ids_by_subtask_id(project_id: &ProjectId, subtask_id: &SubTaskId) -> Result<Vec<TagId>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::get_tag_ids_by_subtask_id(&repositories, project_id, subtask_id).await {
        Ok(tag_ids) => Ok(tag_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag IDs by subtask ID: {:?}", e)),
    }
}


pub async fn get_subtask_ids_by_tag_id(project_id: &ProjectId, tag_id: &TagId) -> Result<Vec<SubTaskId>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::get_subtask_ids_by_tag_id(&repositories, project_id, tag_id).await {
        Ok(subtask_ids) => Ok(subtask_ids),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get subtask IDs by tag ID: {:?}", e)),
    }
}


pub async fn update_subtask_tag_relations(
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    tag_ids: &[TagId],
) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::update_subtask_tag_relations(&repositories, project_id, subtask_id, tag_ids).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update subtask-tag relations: {:?}", e)),
    }
}


pub async fn remove_all_subtask_tags_by_subtask_id(project_id: &ProjectId, subtask_id: &SubTaskId) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::remove_all_subtask_tags_by_subtask_id(&repositories, project_id, subtask_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all subtask tags by subtask ID: {:?}",
            e
        )),
    }
}


pub async fn remove_all_subtask_tags_by_tag_id(project_id: &ProjectId, tag_id: &TagId) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::remove_all_subtask_tags_by_tag_id(&repositories, project_id, tag_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!(
            "Failed to remove all subtask tags by tag ID: {:?}",
            e
        )),
    }
}


pub async fn get_all_subtask_tags(project_id: &ProjectId) -> Result<Vec<SubTaskTag>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match tagging_service::get_all_subtask_tags(&repositories, project_id).await {
        Ok(subtask_tags) => Ok(subtask_tags),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get all subtask tags: {:?}", e)),
    }
}
