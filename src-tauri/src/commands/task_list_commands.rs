use crate::facades::task_list_facades;
use crate::models::command::task_list::TaskListCommand;
use crate::models::command::task_list::TaskListSearchRequest;
use crate::models::command::ModelConverter;
use crate::models::task_list::PartialTaskList;
use crate::models::CommandModelConverter;
use crate::types::id_types::TaskListId;

#[tauri::command]
pub async fn create_task_list(task_list: TaskListCommand) -> Result<bool, String> {
    let internal_task_list = task_list.to_model().await?;
    task_list_facades::create_task_list(&internal_task_list).await
}

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

#[tauri::command]
pub async fn update_task_list(id: String, patch: PartialTaskList) -> Result<bool, String> {
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    task_list_facades::update_task_list(&task_list_id, &patch).await
}

#[tauri::command]
pub async fn delete_task_list(id: String) -> Result<bool, String> {
    let task_list_id = match TaskListId::try_from_str(&id) {
        Ok(t) => t,
        Err(e) => return Err(e.to_string()),
    };
    task_list_facades::delete_task_list(&task_list_id).await
}

#[tauri::command]
pub async fn search_task_lists(
    condition: TaskListSearchRequest,
) -> Result<Vec<TaskListCommand>, String> {
    let results = task_list_facades::search_task_lists(&condition).await?;
    let mut command_results = Vec::new();
    for task_list in results {
        command_results.push(task_list.to_command_model().await?);
    }
    Ok(command_results)
}
