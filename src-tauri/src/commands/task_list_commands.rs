use crate::models::task_list::TaskListCommandModel;
use crate::models::CommandModelConverter;
use crate::state::AppState;
use flequit_core::facades::task_list_facades;
use flequit_model::models::task_projects::task_list::PartialTaskList;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{ProjectId, TaskListId};
use tauri::State;

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn create_task_list(
    state: State<'_, AppState>,
    task_list: TaskListCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&task_list.project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_task_list = task_list.to_model().await?;
    let repositories = state.repositories.read().await;

    task_list_facades::create_task_list(&*repositories, &project_id, &internal_task_list).await
}

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn get_task_list(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<Option<TaskListCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let repositories = state.repositories.read().await;

    let result =
        task_list_facades::get_task_list(&*repositories, &project_id, &task_list_id).await?;
    match result {
        Some(task_list) => Ok(Some(task_list.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn update_task_list(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
    patch: PartialTaskList,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let repositories = state.repositories.read().await;

    task_list_facades::update_task_list(&*repositories, &project_id, &task_list_id, &patch).await
}

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn delete_task_list(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let repositories = state.repositories.read().await;

    task_list_facades::delete_task_list(&*repositories, &project_id, &task_list_id).await
}
