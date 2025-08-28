use flequit_core::facades::subtask_facades;
use crate::models::subtask::SubtaskCommand;
use flequit_model::models::{subtask::PartialSubTask, ModelConverter};
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::SubTaskId;

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
    match subtask_facades::get_sub_task(&subtask_id).await {
        Ok(Some(subtask)) => Ok(Some(subtask.to_command_model().await?)),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to get sub task: {}", e)),
    }

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
