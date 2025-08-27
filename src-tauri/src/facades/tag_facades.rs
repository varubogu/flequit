use crate::errors::service_error::ServiceError;
use crate::models::command::tag::TagSearchRequest;
use crate::models::tag::{PartialTag, Tag};
use crate::services::tag_service;
use crate::types::id_types::TagId;

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

#[tracing::instrument]
pub async fn search_tags(condition: &TagSearchRequest) -> Result<Vec<Tag>, String> {
    if let Some(name) = &condition.name {
        match tag_service::search_tags_by_name(name).await {
            Ok(tags) => Ok(tags),
            Err(e) => Err(format!("Failed to search tags by name: {:?}", e)),
        }
    } else {
        // 名前指定がない場合は全タグを取得
        match tag_service::list_tags().await {
            Ok(tags) => Ok(tags),
            Err(e) => Err(format!("Failed to list tags: {:?}", e)),
        }
    }
}

