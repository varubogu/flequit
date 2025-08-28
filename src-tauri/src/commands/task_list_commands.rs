use flequit_core::facades::task_list_facades;
use crate::models::task_list::TaskListCommand;
use flequit_model::models::ModelConverter;
use flequit_model::models::task_list::PartialTaskList;
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::TaskListId;

#[tracing::instrument]
#[tauri::command]
pub async fn create_task_list(task_list: TaskListCommand) -> Result<bool, String> {
    let internal_task_list = task_list.to_model().await?;
    task_list_facades::create_task_list(&internal_task_list).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_task_list(id: String) -> Result<Option<TaskListCommand>, String> {
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    let result = task_list_facades::get_task_list(&task_list_id).await?;
    match result {
        Some(task_list) => Ok(Some(task_list.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_task_list(id: String, patch: PartialTaskList) -> Result<bool, String> {
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    task_list_facades::update_task_list(&task_list_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_task_list(id: String) -> Result<bool, String> {
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    task_list_facades::delete_task_list(&task_list_id).await
}
