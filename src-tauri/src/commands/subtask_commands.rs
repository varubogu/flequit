use crate::models::{
    subtask_search_request::SubTaskSearchRequest,
    subtask::SubtaskCommandModel, subtask_recurrence::SubtaskRecurrenceCommandModel,
    CommandModelConverter,
};
use crate::state::AppState;
use flequit_core::facades::{recurrence_facades, subtask_facades};
use flequit_model::models::{task_projects::subtask::PartialSubTask, ModelConverter};
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, SubTaskId, UserId};
use tauri::State;
use tracing::instrument;

// Frontend compatibility aliases only

#[instrument(level = "info", skip(state, sub_task), fields(project_id = %project_id, subtask_id = %sub_task.id))]
#[tauri::command]
pub async fn create_sub_task(
    state: State<'_, AppState>,
    project_id: String,
    sub_task: SubtaskCommandModel,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_param = sub_task.to_model().await?;
    let repositories = state.repositories.read().await;

    subtask_facades::create_sub_task(&*repositories, &project_id, &subtask_param, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::subtask", command = "create_sub_task", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, subtask_id = %id))]
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
        Err(e) => {
            tracing::error!(target: "commands::subtask", command = "get_sub_task", project_id = %project_id, subtask_id = %subtask_id, error = %e);
            Err(format!("Failed to get sub task: {}", e))
        }
    }
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, title = ?condition.title))]
#[tauri::command]
pub async fn search_sub_tasks(
    state: State<'_, AppState>,
    project_id: String,
    condition: SubTaskSearchRequest,
) -> Result<Vec<SubtaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;

    let subtasks = subtask_facades::search_sub_tasks(
        &*repositories,
        &project_id,
        condition.task_id.as_deref(),
        condition.title.as_deref(),
        condition.status.as_ref(),
        condition.priority,
        condition.limit,
        condition.offset,
    )
    .await
    .map_err(|e| {
        tracing::error!(target: "commands::subtask", command = "search_sub_tasks", project_id = %project_id, error = %e);
        e
    })?;

    let mut result = Vec::with_capacity(subtasks.len());
    for subtask in subtasks {
        result.push(subtask.to_command_model().await?);
    }

    Ok(result)
}

#[instrument(level = "info", skip(state, patch), fields(project_id = %project_id, subtask_id = %id))]
#[tauri::command]
pub async fn update_sub_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
    patch: PartialSubTask,
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let subtask_id = match SubTaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;

    subtask_facades::update_sub_task(&*repositories, &project_id, &subtask_id, &patch, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::subtask", command = "update_sub_task", project_id = %project_id, subtask_id = %subtask_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, subtask_id = %id))]
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

    subtask_facades::delete_sub_task(&*repositories, &project_id, &subtask_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::subtask", command = "delete_sub_task", project_id = %project_id, subtask_id = %subtask_id, error = %e);
            e
        })
}

// =============================================================================
// サブタスク繰り返し関連付けコマンド
// =============================================================================

/// サブタスクに繰り返しルールを関連付けます。
#[instrument(level = "info", skip(state, subtask_recurrence), fields(project_id = %project_id, subtask_id = %subtask_recurrence.subtask_id, recurrence_rule_id = %subtask_recurrence.recurrence_rule_id))]
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
    .map_err(|e| {
        tracing::error!(target: "commands::subtask", command = "create_subtask_recurrence", project_id = %project_id, subtask_id = %subtask_id, recurrence_rule_id = %recurrence_rule_id, error = %e);
        e
    })
}

/// サブタスクIDによる繰り返し関連付けを取得します。
#[instrument(level = "info", skip(state), fields(project_id = %project_id, subtask_id = %subtask_id))]
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
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::subtask", command = "get_subtask_recurrence_by_subtask_id", project_id = %project_id, subtask_id = %subtask_id_typed, error = %e);
                e
            })?;
    match result {
        Some(subtask_recurrence) => Ok(Some(subtask_recurrence.to_command_model().await?)),
        None => Ok(None),
    }
}

/// サブタスクの繰り返し関連付けを削除します。
#[instrument(level = "info", skip(state), fields(project_id = %project_id, subtask_id = %subtask_id))]
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

    recurrence_facades::delete_subtask_recurrence(&*repositories, &project_id, &subtask_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::subtask", command = "delete_subtask_recurrence", project_id = %project_id, subtask_id = %subtask_id_typed, error = %e);
            e
        })
}
