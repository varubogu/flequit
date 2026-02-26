//! タスクCRUDコマンド（書き込み系）
//!
//! タスクの作成・更新・削除・復元コマンドを提供する

use crate::models::task::TaskCommandModel;
use crate::state::AppState;
use chrono::Utc;
use flequit_core::facades::task_facades;
use flequit_model::models::task_projects::task::PartialTask;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use tauri::State;
use tracing::instrument;

#[instrument(level = "info", skip(state, task), fields(project_id = %task.project_id, task_id = %task.id))]
#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    task: TaskCommandModel,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&task.project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_task = task.to_model().await?;
    let repositories = state.repositories.read().await;
    task_facades::create_task(&*repositories, &project_id, &internal_task, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_task", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state, patch), fields(project_id = %project_id, task_id = ?patch.id))]
#[tauri::command]
pub async fn update_task(
    state: State<'_, AppState>,
    project_id: String,
    patch: PartialTask,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };

    // patchからtask_idを取得
    let task_id = match &patch.id {
        Some(id) => *id,
        None => return Err("Task ID is required in patch".to_string()),
    };

    let repositories = state.repositories.read().await;
    task_facades::update_task(&*repositories, &project_id, &task_id, &patch, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "update_task", project_id = %project_id, task_id = %task_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %id))]
#[tauri::command]
pub async fn delete_task(
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
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    task_facades::delete_task(&*repositories, &project_id, &task_id, &user_id_typed, &timestamp)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "delete_task", project_id = %project_id, task_id = %task_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %id))]
#[tauri::command]
pub async fn restore_task(
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
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    task_facades::restore_task(&*repositories, &project_id, &task_id, &user_id_typed, &timestamp)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "restore_task", project_id = %project_id, task_id = %task_id, error = %e);
            e
        })
}
