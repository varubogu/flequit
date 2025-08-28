use flequit_core::facades::task_facades;
use crate::models::task::{TaskCommand, TaskSearchRequest};
use flequit_model::models::ModelConverter;
use flequit_model::models::task::PartialTask;
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::TaskId;

#[tracing::instrument]
#[tauri::command]
pub async fn create_task(task: TaskCommand) -> Result<bool, String> {
    let internal_task = task.to_model().await?;
    task_facades::create_task(&internal_task).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_task(id: String) -> Result<Option<TaskCommand>, String> {
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let result = task_facades::get_task(&task_id).await?;
    match result {
        Some(task) => Ok(Some(task.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_task(id: String, patch: PartialTask) -> Result<bool, String> {
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    task_facades::update_task(&task_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_task(id: String) -> Result<bool, String> {
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    task_facades::delete_task(&task_id).await
}
