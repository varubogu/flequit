use futures::future::join_all;

use crate::facades::subtask_facades;
use crate::models::command::subtask::{SubtaskCommand, SubtaskSearchRequest};
use crate::models::command::ModelConverter;
use crate::models::subtask::PartialSubTask;
use crate::models::CommandModelConverter;
use crate::types::id_types::SubTaskId;

// Frontend compatibility aliases only
#[tracing::instrument]
#[tauri::command]
pub async fn create_sub_task(sub_task: SubtaskCommand) -> Result<bool, String> {
    let subtask_param = sub_task.to_model().await?;
    subtask_facades::create_sub_task(&subtask_param).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_sub_task(id: String) -> Result<Option<SubtaskCommand>, String> {
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let sub_task_id = SubTaskId::from(subtask_id);
    subtask_facades::get_sub_task(&sub_task_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_sub_task(id: String, patch: PartialSubTask) -> Result<bool, String> {
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    subtask_facades::update_sub_task(&subtask_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_sub_task(id: String) -> Result<bool, String> {
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let sub_task_id = SubTaskId::from(subtask_id);
    subtask_facades::delete_sub_task(&sub_task_id).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn search_sub_tasks(
    condition: SubtaskSearchRequest,
) -> Result<Vec<SubtaskCommand>, String> {
    let sub_tasks = match subtask_facades::search_sub_tasks(&condition).await {
        Ok(sub_tasks) => sub_tasks,
        Err(err) => {
            return Err(err.to_string());
        }
    };
    let command_model: Vec<_> = sub_tasks
        .iter()
        .map(async |sub_task| sub_task.to_command_model().await.unwrap())
        .collect();
    let command_model_result = join_all(command_model).await;
    Ok(command_model_result)
}
