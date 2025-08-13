use crate::facades::tag_facades;
use crate::models::command::tag::{TagCommand, TagSearchRequest};
use crate::models::command::ModelConverter;
use crate::models::CommandModelConverter;

#[tauri::command]
pub async fn create_tag(tag: TagCommand) -> Result<bool, String> {
    let internal_tag = tag.to_model().await?;
    Ok(tag_facades::create_tag(&internal_tag).await?)
}

#[tauri::command]
pub async fn get_tag(id: String) -> Result<Option<TagCommand>, String> {
    let result = tag_facades::get_tag(&id).await?;
    match result {
        Some(tag) => Ok(Some(tag.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn update_tag(tag: TagCommand) -> Result<bool, String> {
    let internal_tag = tag.to_model().await?;
    Ok(tag_facades::update_tag(&internal_tag).await?)
}

#[tauri::command]
pub async fn delete_tag(id: String) -> Result<bool, String> {
    tag_facades::delete_tag(&id).await
}

#[tauri::command]
pub async fn search_tags(condition: TagSearchRequest) -> Result<Vec<TagCommand>, String> {
    let results = tag_facades::search_tags(&condition).await?;
    let mut command_results = Vec::new();
    for tag in results {
        command_results.push(tag.to_command_model().await?);
    }
    Ok(command_results)
}
