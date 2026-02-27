use crate::models::tag::TagCommandModel;
use crate::models::tag_search_request::TagSearchRequest;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use chrono::Utc;
use flequit_core::facades::tag_facades;
use flequit_model::models::task_projects::tag::PartialTag;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{ProjectId, TagId, UserId};
use tauri::State;
use tracing::instrument;

#[instrument(level = "info", skip(state, tag), fields(project_id = %project_id, tag_id = %tag.id))]
#[tauri::command]
pub async fn create_tag(
    state: State<'_, AppState>,
    project_id: String,
    tag: TagCommandModel,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_tag = tag.to_model().await?;
    let repositories = state.repositories.read().await;

    tag_facades::create_tag(&*repositories, &project_id, &internal_tag, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tag", command = "create_tag", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, tag_id = %id))]
#[tauri::command]
pub async fn get_tag(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<Option<TagCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let repositories = state.repositories.read().await;

    let result = tag_facades::get_tag(&*repositories, &project_id, &tag_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tag", command = "get_tag", project_id = %project_id, tag_id = %tag_id, error = %e);
            e
        })?;
    match result {
        Some(tag) => Ok(Some(tag.to_command_model().await?)),
        None => Ok(None),
    }
}

#[instrument(level = "info", skip(state, patch), fields(project_id = %project_id, tag_id = %tag_id))]
#[tauri::command]
pub async fn update_tag(
    state: State<'_, AppState>,
    project_id: String,
    tag_id: String,
    patch: PartialTag,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let tag_id = match TagId::try_from_str(&tag_id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let repositories = state.repositories.read().await;

    tag_facades::update_tag(&*repositories, &project_id, &tag_id, &patch, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tag", command = "update_tag", project_id = %project_id, tag_id = %tag_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, tag_id = %id))]
#[tauri::command]
pub async fn delete_tag(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let timestamp = Utc::now();
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let repositories = state.repositories.read().await;

    tag_facades::delete_tag(&*repositories, &project_id, &tag_id, &user_id_typed, &timestamp)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tag", command = "delete_tag", project_id = %project_id, tag_id = %tag_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, tag_id = %id))]
#[tauri::command]
pub async fn restore_tag(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let timestamp = Utc::now();
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let tag_id = match TagId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let repositories = state.repositories.read().await;

    tag_facades::restore_tag(&*repositories, &project_id, &tag_id, &user_id_typed, &timestamp)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::tag", command = "restore_tag", project_id = %project_id, tag_id = %tag_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, name = ?condition.name))]
#[tauri::command]
pub async fn search_tags(
    state: State<'_, AppState>,
    project_id: String,
    condition: TagSearchRequest,
) -> Result<Vec<TagCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;

    let tags = tag_facades::search_tags(
        &*repositories,
        &project_id,
        condition.name.as_deref(),
        condition.limit,
        condition.offset,
    )
    .await
    .map_err(|e| {
        tracing::error!(target: "commands::tag", command = "search_tags", project_id = %project_id, error = %e);
        e
    })?;

    let mut result = Vec::with_capacity(tags.len());
    for tag in tags {
        result.push(tag.to_command_model().await?);
    }

    Ok(result)
}
