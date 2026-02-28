//! タスク取得コマンド（読み取り系）
//!
//! タスクの取得コマンドを提供する

use crate::models::{task::TaskCommandModel, CommandModelConverter};
use crate::models::task_search_request::TaskSearchRequest;
use crate::state::AppState;
use flequit_core::facades::task_facades;
use flequit_core::services::task_service::TaskSearchCondition;
use flequit_model::types::id_types::{ProjectId, TaskId};
use tauri::State;
use tracing::instrument;

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %id))]
#[tauri::command]
pub async fn get_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<Option<TaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    let result = task_facades::get_task(&*repositories, &project_id, &task_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "get_task", project_id = %project_id, task_id = %task_id, error = %e);
            e
        })?;
    match result {
        Some(task) => Ok(Some(task.to_command_model().await?)),
        None => Ok(None),
    }
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, title = ?condition.title))]
#[tauri::command]
pub async fn search_tasks(
    state: State<'_, AppState>,
    project_id: String,
    condition: TaskSearchRequest,
) -> Result<Vec<TaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    let search_condition = TaskSearchCondition {
        list_id: condition.list_id,
        status: condition.status,
        assigned_user_id: condition.assigned_user_id,
        tag_id: condition.tag_id,
        title: condition.title,
        is_archived: condition.is_archived,
        limit: condition.limit,
        offset: condition.offset,
    };

    let tasks = task_facades::search_tasks(
        &*repositories,
        &project_id,
        &search_condition,
    )
    .await
    .map_err(|e| {
        tracing::error!(target: "commands::task", command = "search_tasks", project_id = %project_id, error = %e);
        e
    })?;

    let mut result = Vec::with_capacity(tasks.len());
    for task in tasks {
        result.push(task.to_command_model().await?);
    }

    Ok(result)
}
