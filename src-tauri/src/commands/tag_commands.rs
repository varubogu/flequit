use flequit_core::facades::tag_facades;
use crate::models::tag::TagCommandModel;
use flequit_model::models::ModelConverter;
use flequit_model::models::task_projects::tag::PartialTag;
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::{TagId, ProjectId};

#[tracing::instrument]
#[tauri::command]
pub async fn create_tag(project_id: String, tag: TagCommandModel) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_tag = tag.to_model().await?;
    tag_facades::create_tag(&project_id, &internal_tag).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_tag(project_id: String, id: String) -> Result<Option<TagCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let result = tag_facades::get_tag(&project_id, &tag_id).await?;
    match result {
        Some(tag) => Ok(Some(tag.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_tag(project_id: String, tag_id: String, patch: PartialTag) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let tag_id = match TagId::try_from_str(&tag_id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    tag_facades::update_tag(&project_id, &tag_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_tag(project_id: String, id: String) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    tag_facades::delete_tag(&project_id, &tag_id).await
}
