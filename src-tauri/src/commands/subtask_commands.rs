use crate::models::{
    subtask::SubtaskCommandModel, subtask_recurrence::SubtaskRecurrenceCommandModel,
    CommandModelConverter,
};
use crate::state::AppState;
use flequit_core::facades::{recurrence_facades, subtask_facades};
use flequit_model::models::{task_projects::subtask::PartialSubTask, ModelConverter};
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, SubTaskId};
use tauri::State;

// Frontend compatibility aliases only

#[tauri::command]
pub async fn create_sub_task(
    state: State<'_, AppState>,
    project_id: String,
    sub_task: SubtaskCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_param = sub_task.to_model().await?;
    let repositories = state.repositories.read().await;

    subtask_facades::create_sub_task(&*repositories, &project_id, &subtask_param).await
}


#[tauri::command]
pub async fn get_sub_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<Option<SubtaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;

    match subtask_facades::get_sub_task(&*repositories, &project_id, &subtask_id).await {
        Ok(Some(subtask)) => Ok(Some(subtask.to_command_model().await?)),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to get sub task: {}", e)),
    }
}


#[tauri::command]
pub async fn update_sub_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
    patch: PartialSubTask,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;

    subtask_facades::update_sub_task(&*repositories, &project_id, &subtask_id, &patch).await
}


#[tauri::command]
pub async fn delete_sub_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;

    subtask_facades::delete_sub_task(&*repositories, &project_id, &subtask_id).await
}

// =============================================================================
// サブタスク繰り返し関連付けコマンド
// =============================================================================

/// サブタスクに繰り返しルールを関連付けます。

#[tauri::command]
pub async fn create_subtask_recurrence(
    state: State<'_, AppState>,
    project_id: String,
    subtask_recurrence: SubtaskRecurrenceCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = SubTaskId::from(subtask_recurrence.subtask_id);
    let recurrence_rule_id = RecurrenceRuleId::from(subtask_recurrence.recurrence_rule_id);

    recurrence_facades::create_subtask_recurrence(
        &*repositories,
        &project_id,
        &subtask_id,
        &recurrence_rule_id,
    )
    .await
}

/// サブタスクIDによる繰り返し関連付けを取得します。

#[tauri::command]
pub async fn get_subtask_recurrence_by_subtask_id(
    state: State<'_, AppState>,
    project_id: String,
    subtask_id: String,
) -> Result<Option<SubtaskRecurrenceCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id_typed = SubTaskId::from(subtask_id);

    let result =
        recurrence_facades::get_subtask_recurrence_by_subtask_id(&*repositories, &project_id, &subtask_id_typed)
            .await?;
    match result {
        Some(subtask_recurrence) => Ok(Some(subtask_recurrence.to_command_model().await?)),
        None => Ok(None),
    }
}

/// サブタスクの繰り返し関連付けを削除します。

#[tauri::command]
pub async fn delete_subtask_recurrence(
    state: State<'_, AppState>,
    project_id: String,
    subtask_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id_typed = SubTaskId::from(subtask_id);

    recurrence_facades::delete_subtask_recurrence(&*repositories, &project_id, &subtask_id_typed).await
}
