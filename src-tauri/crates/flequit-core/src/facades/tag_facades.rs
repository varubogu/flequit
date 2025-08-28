use crate::errors::service_error::ServiceError;
use flequit_model::models::tag::{PartialTag, Tag};
use crate::services::tag_service;
use flequit_model::types::id_types::TagId;

#[tracing::instrument]
pub async fn create_tag(tag: &Tag) -> Result<bool, String> {
    match tag_service::create_tag(tag).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create tag: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn get_tag(id: &TagId) -> Result<Option<Tag>, String> {
    match tag_service::get_tag(id).await {
        Ok(Some(tag)) => Ok(Some(tag)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn update_tag(tag_id: &TagId, patch: &PartialTag) -> Result<bool, String> {
    match tag_service::update_tag(tag_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update tag: {:?}", e)),
    }
}

#[tracing::instrument]
pub async fn delete_tag(id: &TagId) -> Result<bool, String> {
    match tag_service::delete_tag(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete tag: {:?}", e)),
    }
}
