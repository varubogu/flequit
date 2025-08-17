use chrono::Utc;

use crate::errors::service_error::ServiceError;
use crate::models::tag::Tag;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::Repositories;
use crate::types::id_types::TagId;

pub async fn create_tag(tag: &Tag) -> Result<(), ServiceError> {
    let mut new_data = tag.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    let repository = Repositories::new().await?;
    repository.tags.save(&new_data).await?;

    Ok(())
}

pub async fn get_tag(tag_id: &TagId) -> Result<Option<Tag>, ServiceError> {
    let repository: Repositories = Repositories::new().await?;
    Ok(repository.tags.find_by_id(tag_id).await?)
}

pub async fn list_tags() -> Result<Vec<Tag>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.tags.find_all().await?)
}

pub async fn update_tag(tag: &Tag) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tags.save(tag).await?;
    Ok(())
}

pub async fn delete_tag(tag_id: &TagId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.tags.delete(tag_id).await?;
    Ok(())
}

pub async fn search_tags_by_name(name: &str) -> Result<Vec<Tag>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = name;
    Ok(Vec::new())
}

pub async fn get_tag_usage_count(tag_id: &TagId) -> Result<u32, ServiceError> {
    // 一時的に0を返す
    let _ = tag_id;
    Ok(0)
}

pub async fn is_tag_name_exists(
    _name: &str,
    _exclude_id: Option<&str>,
) -> Result<bool, ServiceError> {
    Err(ServiceError::InternalError(
        "Temporarily disabled".to_string(),
    ))
}

pub async fn list_popular_tags(limit: u32) -> Result<Vec<Tag>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = limit;
    Ok(Vec::new())
}
