use crate::models::{
    recurrence_adjustment::RecurrenceAdjustmentCommandModel,
    recurrence_details::RecurrenceDetailsCommandModel, recurrence_rule::RecurrenceRuleCommandModel,
    task::TaskCommandModel, task_recurrence::TaskRecurrenceCommandModel, CommandModelConverter,
};
use crate::state::AppState;
use flequit_core::facades::{recurrence_facades, task_facades};
use flequit_model::models::task_projects::task::PartialTask;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, TaskId};
use tauri::State;
use tracing::instrument;

#[instrument(level = "info", skip(state, task), fields(project_id = %task.project_id, task_id = %task.id))]
#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    task: TaskCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&task.project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_task = task.to_model().await?;
    let repositories = state.repositories.read().await;
    task_facades::create_task(&*repositories, &project_id, &internal_task)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_task", project_id = %project_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %id))]
#[tauri::command]
pub async fn get_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<Option<TaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    let result = task_facades::get_task(&*repositories, &project_id, &task_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "get_task", project_id = %project_id, task_id = %task_id, error = %e);
            e
        })?;
    match result {
        Some(task) => Ok(Some(task.to_command_model().await?)),
        None => Ok(None),
    }
}

#[instrument(level = "info", skip(state, patch), fields(project_id = %project_id, task_id = %id))]
#[tauri::command]
pub async fn update_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
    patch: PartialTask,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    task_facades::update_task(&*repositories, &project_id, &task_id, &patch)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "update_task", project_id = %project_id, task_id = %task_id, error = %e);
            e
        })
}

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %id))]
#[tauri::command]
pub async fn delete_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    task_facades::delete_task(&*repositories, &project_id, &task_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "delete_task", project_id = %project_id, task_id = %task_id, error = %e);
            e
        })
}

// =============================================================================
// タスク繰り返し関連付けコマンド
// =============================================================================

/// タスクに繰り返しルールを関連付けます。

#[instrument(level = "info", skip(state, task_recurrence), fields(project_id = %project_id, task_id = %task_recurrence.task_id, recurrence_rule_id = %task_recurrence.recurrence_rule_id))]
#[tauri::command]
pub async fn create_task_recurrence(
    state: State<'_, AppState>,
    project_id: String,
    task_recurrence: TaskRecurrenceCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = TaskId::from(task_recurrence.task_id);
    let repositories = state.repositories.read().await;
    let recurrence_rule_id = RecurrenceRuleId::from(task_recurrence.recurrence_rule_id);
    recurrence_facades::create_task_recurrence(
        &*repositories,
        &project_id,
        &task_id,
        &recurrence_rule_id,
    )
    .await
    .map_err(|e| {
        tracing::error!(target: "commands::task", command = "create_task_recurrence", project_id = %project_id, task_id = %task_id, recurrence_rule_id = %recurrence_rule_id, error = %e);
        e
    })
}

/// タスクIDによる繰り返し関連付けを取得します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %task_id))]
#[tauri::command]
pub async fn get_task_recurrence_by_task_id(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
) -> Result<Option<TaskRecurrenceCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id_typed = TaskId::from(task_id);
    let repositories = state.repositories.read().await;
    let result =
        recurrence_facades::get_task_recurrence_by_task_id(&*repositories, &project_id, &task_id_typed)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::task", command = "get_task_recurrence_by_task_id", project_id = %project_id, task_id = %task_id_typed, error = %e);
                e
            })?;
    match result {
        Some(task_recurrence) => Ok(Some(task_recurrence.to_command_model().await?)),
        None => Ok(None),
    }
}

/// タスクの繰り返し関連付けを削除します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %task_id))]
#[tauri::command]
pub async fn delete_task_recurrence(
    state: State<'_, AppState>,
    project_id: String,
    task_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id_typed = TaskId::from(task_id);
    recurrence_facades::delete_task_recurrence(&*repositories, &project_id, &task_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "delete_task_recurrence", project_id = %project_id, task_id = %task_id_typed, error = %e);
            e
        })
}

// =============================================================================
// 繰り返しルール関連コマンド
// =============================================================================

/// 繰り返しルールを作成します。

#[instrument(level = "info", skip(state, rule), fields(project_id = %project_id, rule_id = %rule.id))]
#[tauri::command]
pub async fn create_recurrence_rule(
    state: State<'_, AppState>,
    project_id: String,
    rule: RecurrenceRuleCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_rule = rule.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::create_recurrence_rule(&*repositories, &project_id, internal_rule)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_recurrence_rule", project_id = %project_id, error = %e);
            e
        })
}

/// 繰り返しルールを取得します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, rule_id = %rule_id))]
#[tauri::command]
pub async fn get_recurrence_rule(
    state: State<'_, AppState>,
    project_id: String,
    rule_id: String,
) -> Result<Option<RecurrenceRuleCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let rule = recurrence_facades::get_recurrence_rule(&*repositories, &project_id, rule_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "get_recurrence_rule", project_id = %project_id, error = %e);
            e
        })?;
    match rule {
        Some(r) => Ok(Some(r.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての繰り返しルールを取得します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id))]
#[tauri::command]
pub async fn get_all_recurrence_rules(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<RecurrenceRuleCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let rules = recurrence_facades::get_all_recurrence_rules(&*repositories, &project_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "get_all_recurrence_rules", project_id = %project_id, error = %e);
            e
        })?;
    let mut result = Vec::new();
    for rule in rules {
        result.push(rule.to_command_model().await?);
    }
    Ok(result)
}

/// 繰り返しルールを更新します。

#[instrument(level = "info", skip(state, rule), fields(project_id = %project_id, rule_id = %rule.id))]
#[tauri::command]
pub async fn update_recurrence_rule(
    state: State<'_, AppState>,
    project_id: String,
    rule: RecurrenceRuleCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_rule = rule.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::update_recurrence_rule(&*repositories, &project_id, internal_rule)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "update_recurrence_rule", project_id = %project_id, error = %e);
            e
        })
}

/// 繰り返しルールを削除します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, rule_id = %rule_id))]
#[tauri::command]
pub async fn delete_recurrence_rule(
    state: State<'_, AppState>,
    project_id: String,
    rule_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    recurrence_facades::delete_recurrence_rule(&*repositories, &project_id, rule_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "delete_recurrence_rule", project_id = %project_id, error = %e);
            e
        })
}

// =============================================================================
// 繰り返し調整関連コマンド
// =============================================================================

/// 繰り返し調整を作成します。

#[instrument(level = "info", skip(state, adjustment), fields(project_id = %project_id))]
#[tauri::command]
pub async fn create_recurrence_adjustment(
    state: State<'_, AppState>,
    project_id: String,
    adjustment: RecurrenceAdjustmentCommandModel,
) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_adjustment = adjustment.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::create_recurrence_adjustment(&*repositories, &project_id, internal_adjustment)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_recurrence_adjustment", project_id = %project_id, error = %e);
            e
        })
}

/// 繰り返しルールIDによる調整一覧を取得します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, rule_id = %rule_id))]
#[tauri::command]
pub async fn get_recurrence_adjustments_by_rule_id(
    state: State<'_, AppState>,
    project_id: String,
    rule_id: String,
) -> Result<Vec<RecurrenceAdjustmentCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let adjustments =
        recurrence_facades::get_recurrence_adjustments_by_rule_id(&*repositories, &project_id, rule_id)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::task", command = "get_recurrence_adjustments_by_rule_id", project_id = %project_id, error = %e);
                e
            })?;
    let mut result = Vec::new();
    for adjustment in adjustments {
        result.push(adjustment.to_command_model().await?);
    }
    Ok(result)
}

/// 繰り返し調整を削除します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, adjustment_id = %adjustment_id))]
#[tauri::command]
pub async fn delete_recurrence_adjustment(
    state: State<'_, AppState>,
    project_id: String,
    adjustment_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    recurrence_facades::delete_recurrence_adjustment(&*repositories, &project_id, adjustment_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "delete_recurrence_adjustment", project_id = %project_id, error = %e);
            e
        })
}

// =============================================================================
// 繰り返し詳細関連コマンド
// =============================================================================

/// 繰り返し詳細を作成します。

#[instrument(level = "info", skip(state, details), fields(project_id = %project_id))]
#[tauri::command]
pub async fn create_recurrence_details(
    state: State<'_, AppState>,
    project_id: String,
    details: RecurrenceDetailsCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let internal_details = details.to_model().await?;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    recurrence_facades::create_recurrence_details(&*repositories, &project_id, internal_details)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_recurrence_details", project_id = %project_id, error = %e);
            e
        })
}

/// 繰り返しルールIDによる詳細を取得します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, rule_id = %rule_id))]
#[tauri::command]
pub async fn get_recurrence_details_by_rule_id(
    state: State<'_, AppState>,
    project_id: String,
    rule_id: String,
) -> Result<Option<RecurrenceDetailsCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let details =
        recurrence_facades::get_recurrence_details_by_rule_id(&*repositories, &project_id, rule_id)
            .await
            .map_err(|e| {
                tracing::error!(target: "commands::task", command = "get_recurrence_details_by_rule_id", project_id = %project_id, error = %e);
                e
            })?;
    match details {
        Some(detail) => Ok(Some(detail.to_command_model().await?)),
        None => Ok(None),
    }
}

/// 繰り返し詳細を更新します。

#[instrument(level = "info", skip(state, details), fields(project_id = %project_id))]
#[tauri::command]
pub async fn update_recurrence_details(
    state: State<'_, AppState>,
    project_id: String,
    details: RecurrenceDetailsCommandModel,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let internal_details = details.to_model().await?;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    recurrence_facades::update_recurrence_details(&*repositories, &project_id, internal_details)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "update_recurrence_details", project_id = %project_id, error = %e);
            e
        })
}

/// 繰り返し詳細を削除します。

#[instrument(level = "info", skip(state), fields(project_id = %project_id, details_id = %details_id))]
#[tauri::command]
pub async fn delete_recurrence_details(
    state: State<'_, AppState>,
    project_id: String,
    details_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let details_id = match RecurrenceRuleId::try_from_str(&details_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    recurrence_facades::delete_recurrence_details(&*repositories, &project_id, &details_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "delete_recurrence_details", project_id = %project_id, error = %e);
            e
        })
}
