use crate::facades::tag_facades;
use crate::models::search_request_models::TagSearchRequest;
use crate::models::tag_models::Tag;

#[tauri::command]
pub async fn create_tag(tag: Tag) -> Result<bool, String> {
    tag_facades::create_tag(&tag).await
}

#[tauri::command]
pub async fn get_tag(id: String) -> Result<Option<Tag>, String> {
    tag_facades::get_tag(&id).await
}

#[tauri::command]
pub async fn update_tag(tag: Tag) -> Result<bool, String> {
    tag_facades::update_tag(&tag).await
}

#[tauri::command]
pub async fn delete_tag(id: String) -> Result<bool, String> {
    tag_facades::delete_tag(&id).await
}

#[tauri::command]
pub async fn search_tags(condition: TagSearchRequest) -> Result<Vec<Tag>, String> {
    tag_facades::search_tags(&condition).await
}