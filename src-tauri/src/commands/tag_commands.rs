use crate::facades::tag_facades;
use crate::models::command::tag::{TagCommand, TagSearchRequest};
use crate::models::command::ModelConverter;
use crate::models::tag::PartialTag;
use crate::models::CommandModelConverter;
use crate::types::id_types::TagId;

#[tracing::instrument]
#[tauri::command]
pub async fn create_tag(tag: TagCommand) -> Result<bool, String> {
    let internal_tag = tag.to_model().await?;
    tag_facades::create_tag(&internal_tag).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_tag(id: String) -> Result<Option<TagCommand>, String> {
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let result = tag_facades::get_tag(&tag_id).await?;
    match result {
        Some(tag) => Ok(Some(tag.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_tag(id: String, patch: PartialTag) -> Result<bool, String> {
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    tag_facades::update_tag(&tag_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_tag(id: String) -> Result<bool, String> {
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    tag_facades::delete_tag(&tag_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn search_tags(condition: TagSearchRequest) -> Result<Vec<TagCommand>, String> {
    let results = tag_facades::search_tags(&condition).await?;
    let mut command_results = Vec::new();
    for tag in results {
        command_results.push(tag.to_command_model().await?);
    }
    Ok(command_results)
}
