use crate::services::tag_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::tag::{PartialTag, Tag};
use flequit_model::types::id_types::{ProjectId, TagId};
use flequit_types::errors::service_error::ServiceError;

pub async fn create_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag: &Tag,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::create_tag(repositories, project_id, tag).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create tag: {:?}", e)),
    }
}

pub async fn get_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TagId,
) -> Result<Option<Tag>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::get_tag(repositories, project_id, id).await {
        Ok(Some(tag)) => Ok(Some(tag)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag: {:?}", e)),
    }
}

pub async fn update_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    tag_id: &TagId,
    patch: &PartialTag,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::update_tag(repositories, project_id, tag_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update tag: {:?}", e)),
    }
}

pub async fn delete_tag<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TagId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match tag_service::delete_tag(repositories, project_id, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete tag: {:?}", e)),
    }
}
