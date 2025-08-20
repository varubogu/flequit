use crate::facades::task_facades;
use crate::models::command::task::{TaskCommand, TaskSearchRequest};
use crate::models::command::ModelConverter;
use crate::models::CommandModelConverter;
use crate::types::id_types::TaskId;

#[tauri::command]
pub async fn create_task(task: TaskCommand) -> Result<bool, String> {
    let internal_task = task.to_model().await?;
    task_facades::create_task(&internal_task).await
}

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

#[tauri::command]
pub async fn update_task(task: TaskCommand) -> Result<bool, String> {
    let internal_task = task.to_model().await?;
    task_facades::update_task(&internal_task).await
}

#[tauri::command]
pub async fn delete_task(id: String) -> Result<bool, String> {
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    task_facades::delete_task(&task_id).await
}

#[tauri::command]
pub async fn search_tasks(condition: TaskSearchRequest) -> Result<Vec<TaskCommand>, String> {
    let results = task_facades::search_tasks(&condition).await?;
    let mut command_results = Vec::new();
    for task in results {
        command_results.push(task.to_command_model().await?);
    }
    Ok(command_results)
}
