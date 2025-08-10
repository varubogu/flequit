use serde::{Serialize, Deserialize};
use crate::types::task_types::Tag;
use crate::services::tag_service::TagService;
use crate::services::repository_service::{get_repositories, get_repository_searcher};

#[derive(Debug, Serialize, Deserialize)]
pub struct TagResponse {
    pub success: bool,
    pub data: Option<Tag>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagSearchRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub usage_count_min: Option<u32>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub order_by_popularity: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagDeleteRequest {
    pub tag_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagSearchResponse {
    pub success: bool,
    pub data: Vec<Tag>,
    pub total_count: Option<usize>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagDeleteResponse {
    pub success: bool,
    pub message: Option<String>,
}

#[tauri::command]
pub async fn create_tag(tag: Tag) -> Result<TagResponse, String> {
    let tag_service = TagService;
    let mut repos = get_repositories();
    match tag_service.create_tag(&mut repos, &tag).await {
        Ok(_) => Ok(TagResponse { success: true, data: Some(tag), message: Some("Tag created".to_string()) }),
        Err(e) => Ok(TagResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn get_tag(tag_id: String) -> Result<TagResponse, String> {
    let tag_service = TagService;
    let repo = get_repository_searcher();
    match tag_service.get_tag(&*repo, &tag_id).await {
        Ok(tag) => Ok(TagResponse { success: true, data: tag, message: Some("Tag found".to_string()) }),
        Err(e) => Ok(TagResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn list_tags() -> Result<Vec<Tag>, String> {
    let tag_service = TagService;
    let repo = get_repository_searcher();
    tag_service.list_tags(&*repo).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_tag(tag: Tag) -> Result<TagResponse, String> {
    let tag_service = TagService;
    let mut repos = get_repositories();
    match tag_service.update_tag(&mut repos, &tag).await {
        Ok(_) => Ok(TagResponse { success: true, data: Some(tag), message: Some("Tag updated".to_string()) }),
        Err(e) => Ok(TagResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn delete_tag(tag_id: String) -> Result<bool, String> {
    let tag_service = TagService;
    let mut repos = get_repositories();
    tag_service.delete_tag(&mut repos, &tag_id).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_tags_by_name(name: String) -> Result<Vec<Tag>, String> {
    let tag_service = TagService;
    let repo = get_repository_searcher();
    tag_service.search_tags_by_name(&*repo, &name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tag_usage_count(tag_id: String) -> Result<u32, String> {
    let tag_service = TagService;
    let repo = get_repository_searcher();
    tag_service.get_tag_usage_count(&*repo, &tag_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_tag_name_exists(name: String, exclude_id: Option<String>) -> Result<bool, String> {
    let tag_service = TagService;
    let repo = get_repository_searcher();
    tag_service.is_tag_name_exists(&*repo, &name, exclude_id.as_deref()).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_popular_tags(limit: Option<u32>) -> Result<Vec<Tag>, String> {
    let tag_service = TagService;
    let repo = get_repository_searcher();
    tag_service.list_popular_tags(&*repo, limit.unwrap_or(10)).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_tags(request: TagSearchRequest) -> Result<TagSearchResponse, String> {
    let tag_service = TagService;
    let repo = get_repository_searcher();
    let tags = tag_service.list_tags(&*repo).await.map_err(|e| e.to_string())?;
    // Manual filtering for now
    let filtered_tags: Vec<Tag> = tags.into_iter().filter(|tag|{
        let name_match = request.name.as_ref().map_or(true, |n| tag.name.contains(n));
        let color_match = request.color.as_ref().map_or(true, |c| tag.color.as_ref().map_or(false, |tc| tc.contains(c)));
        name_match && color_match
    }).collect();

    Ok(TagSearchResponse {
        success: true,
        data: filtered_tags,
        total_count: None,
        message: Some("Tags searched".to_string()),
    })
}

#[tauri::command]
pub async fn delete_tag_by_request(request: TagDeleteRequest) -> Result<TagDeleteResponse, String> {
    match delete_tag(request.tag_id).await {
        Ok(_) => Ok(TagDeleteResponse { success: true, message: Some("Tag deleted".to_string()) }),
        Err(e) => Ok(TagDeleteResponse { success: false, message: Some(e) }),
    }
}