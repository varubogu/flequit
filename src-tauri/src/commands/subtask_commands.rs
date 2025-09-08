use flequit_core::facades::{subtask_facades, recurrence_facades};
use crate::models::{
    subtask::SubtaskCommandModel,
    subtask_recurrence::SubtaskRecurrenceCommandModel,
    CommandModelConverter,
};
use flequit_model::models::{task_projects::subtask::PartialSubTask, ModelConverter};
use flequit_model::types::id_types::{SubTaskId, ProjectId};

// Frontend compatibility aliases only
#[tracing::instrument]
#[tauri::command]
pub async fn create_sub_task(project_id: String, sub_task: SubtaskCommandModel) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_param = sub_task.to_model().await?;
    subtask_facades::create_sub_task(&project_id, &subtask_param).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_sub_task(project_id: String, id: String) -> Result<Option<SubtaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    match subtask_facades::get_sub_task(&project_id, &subtask_id).await {
        Ok(Some(subtask)) => Ok(Some(subtask.to_command_model().await?)),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to get sub task: {}", e)),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_sub_task(project_id: String, id: String, patch: PartialSubTask) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    subtask_facades::update_sub_task(&project_id, &subtask_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_sub_task(project_id: String, id: String) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    subtask_facades::delete_sub_task(&project_id, &subtask_id).await
}

// =============================================================================
// サブタスク繰り返し関連付けコマンド
// =============================================================================

/// サブタスクに繰り返しルールを関連付けます。
#[tracing::instrument]
#[tauri::command]
pub async fn create_subtask_recurrence(subtask_recurrence: SubtaskRecurrenceCommandModel) -> Result<bool, String> {
    let subtask_id = SubTaskId::from(subtask_recurrence.subtask_id);
    recurrence_facades::create_subtask_recurrence(&subtask_id, &subtask_recurrence.recurrence_rule_id).await
}

/// サブタスクIDによる繰り返し関連付けを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_subtask_recurrence_by_subtask_id(subtask_id: String) -> Result<Option<SubtaskRecurrenceCommandModel>, String> {
    let subtask_id_typed = SubTaskId::from(subtask_id);
    let result = recurrence_facades::get_subtask_recurrence_by_subtask_id(&subtask_id_typed).await?;
    match result {
        Some(subtask_recurrence) => Ok(Some(subtask_recurrence.to_command_model().await?)),
        None => Ok(None),
    }
}

/// サブタスクの繰り返し関連付けを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_subtask_recurrence(subtask_id: String) -> Result<bool, String> {
    let subtask_id_typed = SubTaskId::from(subtask_id);
    recurrence_facades::delete_subtask_recurrence(&subtask_id_typed).await
}
