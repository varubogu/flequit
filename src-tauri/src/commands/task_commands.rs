use crate::models::{
    recurrence_adjustment::RecurrenceAdjustmentCommandModel,
    recurrence_details::RecurrenceDetailsCommandModel, recurrence_rule::RecurrenceRuleCommandModel,
    task::TaskCommandModel, task_recurrence::TaskRecurrenceCommandModel, CommandModelConverter,
};
use crate::state::AppState;
use flequit_core::facades::{recurrence_facades, task_facades};
use flequit_model::models::task_projects::task::PartialTask;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{ProjectId, TaskId};
use tauri::State;

#[tracing::instrument]
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
    task_facades::create_task(&*repositories, &project_id, &internal_task).await
}

#[tracing::instrument]
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
    let result = task_facades::get_task(&*repositories, &project_id, &task_id).await?;
    match result {
        Some(task) => Ok(Some(task.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
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
    task_facades::update_task(&*repositories, &project_id, &task_id, &patch).await
}

#[tracing::instrument]
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
    task_facades::delete_task(&*repositories, &project_id, &task_id).await
}

// =============================================================================
// タスク繰り返し関連付けコマンド
// =============================================================================

/// タスクに繰り返しルールを関連付けます。
#[tracing::instrument]
#[tauri::command]
pub async fn create_task_recurrence(
    state: State<'_, AppState>,
    task_recurrence: TaskRecurrenceCommandModel,
) -> Result<bool, String> {
    let task_id = TaskId::from(task_recurrence.task_id);
    let repositories = state.repositories.read().await;
    recurrence_facades::create_task_recurrence(
        &*repositories,
        &task_id,
        &task_recurrence.recurrence_rule_id,
    )
    .await
}

/// タスクIDによる繰り返し関連付けを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_task_recurrence_by_task_id(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Option<TaskRecurrenceCommandModel>, String> {
    let task_id_typed = TaskId::from(task_id);
    let repositories = state.repositories.read().await;
    let result =
        recurrence_facades::get_task_recurrence_by_task_id(&*repositories, &task_id_typed).await?;
    match result {
        Some(task_recurrence) => Ok(Some(task_recurrence.to_command_model().await?)),
        None => Ok(None),
    }
}

/// タスクの繰り返し関連付けを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_task_recurrence(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<bool, String> {
    let task_id_typed = TaskId::from(task_id);
    let repositories = state.repositories.read().await;
    recurrence_facades::delete_task_recurrence(&*repositories, &task_id_typed).await
}

// =============================================================================
// 繰り返しルール関連コマンド
// =============================================================================

/// 繰り返しルールを作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_recurrence_rule(
    state: State<'_, AppState>,
    rule: RecurrenceRuleCommandModel,
) -> Result<bool, String> {
    let internal_rule = rule.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::create_recurrence_rule(&*repositories, internal_rule).await
}

/// 繰り返しルールを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_recurrence_rule(
    state: State<'_, AppState>,
    rule_id: String,
) -> Result<Option<RecurrenceRuleCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let rule = recurrence_facades::get_recurrence_rule(&*repositories, rule_id).await?;
    match rule {
        Some(r) => Ok(Some(r.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての繰り返しルールを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_recurrence_rules(
    state: State<'_, AppState>,
) -> Result<Vec<RecurrenceRuleCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let rules = recurrence_facades::get_all_recurrence_rules(&*repositories).await?;
    let mut result = Vec::new();
    for rule in rules {
        result.push(rule.to_command_model().await?);
    }
    Ok(result)
}

/// 繰り返しルールを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_recurrence_rule(
    state: State<'_, AppState>,
    rule: RecurrenceRuleCommandModel,
) -> Result<bool, String> {
    let internal_rule = rule.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::update_recurrence_rule(&*repositories, internal_rule).await
}

/// 繰り返しルールを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_recurrence_rule(
    state: State<'_, AppState>,
    rule_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    recurrence_facades::delete_recurrence_rule(&*repositories, rule_id).await
}

// =============================================================================
// 繰り返し調整関連コマンド
// =============================================================================

/// 繰り返し調整を作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_recurrence_adjustment(
    state: State<'_, AppState>,
    adjustment: RecurrenceAdjustmentCommandModel,
) -> Result<bool, String> {
    let internal_adjustment = adjustment.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::create_recurrence_adjustment(&*repositories, internal_adjustment).await
}

/// 繰り返しルールIDによる調整一覧を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_recurrence_adjustments_by_rule_id(
    state: State<'_, AppState>,
    rule_id: String,
) -> Result<Vec<RecurrenceAdjustmentCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let adjustments =
        recurrence_facades::get_recurrence_adjustments_by_rule_id(&*repositories, rule_id).await?;
    let mut result = Vec::new();
    for adjustment in adjustments {
        result.push(adjustment.to_command_model().await?);
    }
    Ok(result)
}

/// 繰り返し調整を削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_recurrence_adjustment(
    state: State<'_, AppState>,
    adjustment_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    recurrence_facades::delete_recurrence_adjustment(&*repositories, adjustment_id).await
}

// =============================================================================
// 繰り返し詳細関連コマンド
// =============================================================================

/// 繰り返し詳細を作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_recurrence_details(
    state: State<'_, AppState>,
    details: RecurrenceDetailsCommandModel,
) -> Result<bool, String> {
    let internal_details = details.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::create_recurrence_details(&*repositories, internal_details).await
}

/// 繰り返しルールIDによる詳細を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_recurrence_details_by_rule_id(
    state: State<'_, AppState>,
    rule_id: String,
) -> Result<Option<RecurrenceDetailsCommandModel>, String> {
    let repositories = state.repositories.read().await;
    let details =
        recurrence_facades::get_recurrence_details_by_rule_id(&*repositories, rule_id).await?;
    match details {
        Some(detail) => Ok(Some(detail.to_command_model().await?)),
        None => Ok(None),
    }
}

/// 繰り返し詳細を更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_recurrence_details(
    state: State<'_, AppState>,
    details: RecurrenceDetailsCommandModel,
) -> Result<bool, String> {
    let internal_details = details.to_model().await?;
    let repositories = state.repositories.read().await;
    recurrence_facades::update_recurrence_details(&*repositories, internal_details).await
}

/// 繰り返し詳細を削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_recurrence_details(
    state: State<'_, AppState>,
    details_id: String,
) -> Result<bool, String> {
    let repositories = state.repositories.read().await;
    recurrence_facades::delete_recurrence_details(&*repositories, details_id).await
}
