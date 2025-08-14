use crate::models::command::tag::TagSearchRequest;
use crate::models::tag::Tag;
use crate::services::tag_service::TagService;
use crate::errors::service_error::ServiceError;

pub async fn create_tag(tag: &Tag) -> Result<bool, String> {
    let service = TagService;

    match service.create_tag(&tag).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create tag: {:?}", e))
    }
}

pub async fn get_tag(id: &str) -> Result<Option<Tag>, String> {
    let service = TagService;

    match service.get_tag(id).await {
        Ok(Some(tag)) => Ok(Some(tag)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get tag: {:?}", e))
    }
}

pub async fn update_tag(tag: &Tag) -> Result<bool, String> {
    let service = TagService;

    match service.update_tag(&tag).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update tag: {:?}", e))
    }
}

pub async fn delete_tag(id: &str) -> Result<bool, String> {
    let service = TagService;

    match service.delete_tag(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete tag: {:?}", e))
    }
}

pub async fn search_tags(condition: &TagSearchRequest) -> Result<Vec<Tag>, String> {
    let service = TagService;

    // TagSearchRequestでサポートされている検索条件に基づいて検索
    if let Some(name) = &condition.name {
        match service.search_tags_by_name(name).await {
            Ok(tags) => Ok(tags),
            Err(e) => Err(format!("Failed to search tags by name: {:?}", e))
        }
    } else {
        // 名前指定がない場合は全タグを取得
        match service.list_tags().await {
            Ok(tags) => Ok(tags),
            Err(e) => Err(format!("Failed to list tags: {:?}", e))
        }
    }
}
