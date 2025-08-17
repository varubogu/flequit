use crate::models::tag::Tag;
use crate::errors::service_error::ServiceError;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::unified::UnifiedRepositories;
use crate::types::id_types::TagId;


pub async fn create_tag(
    tag: &Tag,
) -> Result<(), ServiceError> {
    if tag.name.trim().is_empty() {
        return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
    }
    let repository = UnifiedRepositories::new().await?;
    repository.tags.save(tag).await?;
    Ok(())
}

pub async fn get_tag(
    tag_id: &TagId,
) -> Result<Option<Tag>, ServiceError> {
    let repository: UnifiedRepositories = UnifiedRepositories::new().await?;
    Ok(repository.tags.find_by_id(tag_id).await?)
}

pub async fn list_tags(
) -> Result<Vec<Tag>, ServiceError> {
    // 一時的に空のVecを返す
    Ok(Vec::new())
}

pub async fn update_tag(
    tag: &Tag,
) -> Result<(), ServiceError> {
    if tag.name.trim().is_empty() {
        return Err(ServiceError::ValidationError("Tag name cannot be empty".to_string()));
    }
    let repository = UnifiedRepositories::new().await?;
    repository.tags.save(tag).await?;
    Ok(())
}

pub async fn delete_tag(
    tag_id: &TagId,
) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = tag_id;
    Ok(())
}

pub async fn search_tags_by_name(
    name: &str,
) -> Result<Vec<Tag>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = name;
    Ok(Vec::new())
}

pub async fn get_tag_usage_count(
    tag_id: &TagId,
) -> Result<u32, ServiceError> {
    // 一時的に0を返す
    let _ = tag_id;
    Ok(0)
}

pub async fn is_tag_name_exists(
    _name: &str,
    _exclude_id: Option<&str>,
) -> Result<bool, ServiceError> {
    Err(ServiceError::InternalError("Temporarily disabled".to_string()))
}

pub async fn list_popular_tags(
    limit: u32,
) -> Result<Vec<Tag>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = limit;
    Ok(Vec::new())
}
