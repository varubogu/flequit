use flequit_core::facades::{task_facades, recurrence_facades};
use flequit_infrastructure::InfrastructureRepositories;
use crate::models::{
    task::TaskCommandModel,
    task_recurrence::TaskRecurrenceCommandModel,
    recurrence_rule::RecurrenceRuleCommandModel,
    recurrence_adjustment::RecurrenceAdjustmentCommandModel,
    recurrence_details::RecurrenceDetailsCommandModel,
    CommandModelConverter,
};
use flequit_model::models::ModelConverter;
use flequit_model::models::task_projects::task::PartialTask;
use flequit_model::types::id_types::{TaskId, ProjectId};

#[tracing::instrument]
#[tauri::command]
pub async fn create_task(task: TaskCommandModel) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&task.project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_task = task.to_model().await?;
    let repositories = InfrastructureRepositories::instance().await;
    task_facades::create_task(&repositories, &project_id, &internal_task).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn get_task(project_id: String, id: String) -> Result<Option<TaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = InfrastructureRepositories::instance().await;
    let result = task_facades::get_task(&repositories, &project_id, &task_id).await?;
    match result {
        Some(task) => Ok(Some(task.to_command_model().await?)),
        None => Ok(None),
    }
}

#[tracing::instrument]
#[tauri::command]
pub async fn update_task(project_id: String, id: String, patch: PartialTask) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = InfrastructureRepositories::instance().await;
    task_facades::update_task(&repositories, &project_id, &task_id, &patch).await
}

#[tracing::instrument]
#[tauri::command]
pub async fn delete_task(project_id: String, id: String) -> Result<bool, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = InfrastructureRepositories::instance().await;
    task_facades::delete_task(&repositories, &project_id, &task_id).await
}

// =============================================================================
// タスク繰り返し関連付けコマンド
// =============================================================================

/// タスクに繰り返しルールを関連付けます。
#[tracing::instrument]
#[tauri::command]
pub async fn create_task_recurrence(task_recurrence: TaskRecurrenceCommandModel) -> Result<bool, String> {
    let task_id = TaskId::from(task_recurrence.task_id);
    recurrence_facades::create_task_recurrence(&task_id, &task_recurrence.recurrence_rule_id).await
}

/// タスクIDによる繰り返し関連付けを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_task_recurrence_by_task_id(task_id: String) -> Result<Option<TaskRecurrenceCommandModel>, String> {
    let task_id_typed = TaskId::from(task_id);
    let result = recurrence_facades::get_task_recurrence_by_task_id(&task_id_typed).await?;
    match result {
        Some(task_recurrence) => Ok(Some(task_recurrence.to_command_model().await?)),
        None => Ok(None),
    }
}

/// タスクの繰り返し関連付けを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_task_recurrence(task_id: String) -> Result<bool, String> {
    let task_id_typed = TaskId::from(task_id);
    recurrence_facades::delete_task_recurrence(&task_id_typed).await
}

// =============================================================================
// 繰り返しルール関連コマンド
// =============================================================================

/// 繰り返しルールを作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_recurrence_rule(rule: RecurrenceRuleCommandModel) -> Result<bool, String> {
    let internal_rule = rule.to_model().await?;
    recurrence_facades::create_recurrence_rule(internal_rule).await
}

/// 繰り返しルールを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_recurrence_rule(rule_id: String) -> Result<Option<RecurrenceRuleCommandModel>, String> {
    let rule = recurrence_facades::get_recurrence_rule(rule_id).await?;
    match rule {
        Some(r) => Ok(Some(r.to_command_model().await?)),
        None => Ok(None),
    }
}

/// すべての繰り返しルールを取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_all_recurrence_rules() -> Result<Vec<RecurrenceRuleCommandModel>, String> {
    let rules = recurrence_facades::get_all_recurrence_rules().await?;
    let mut result = Vec::new();
    for rule in rules {
        result.push(rule.to_command_model().await?);
    }
    Ok(result)
}

/// 繰り返しルールを更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_recurrence_rule(rule: RecurrenceRuleCommandModel) -> Result<bool, String> {
    let internal_rule = rule.to_model().await?;
    recurrence_facades::update_recurrence_rule(internal_rule).await
}

/// 繰り返しルールを削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_recurrence_rule(rule_id: String) -> Result<bool, String> {
    recurrence_facades::delete_recurrence_rule(rule_id).await
}

// =============================================================================
// 繰り返し調整関連コマンド
// =============================================================================

/// 繰り返し調整を作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_recurrence_adjustment(adjustment: RecurrenceAdjustmentCommandModel) -> Result<bool, String> {
    let internal_adjustment = adjustment.to_model().await?;
    recurrence_facades::create_recurrence_adjustment(internal_adjustment).await
}

/// 繰り返しルールIDによる調整一覧を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_recurrence_adjustments_by_rule_id(rule_id: String) -> Result<Vec<RecurrenceAdjustmentCommandModel>, String> {
    let adjustments = recurrence_facades::get_recurrence_adjustments_by_rule_id(rule_id).await?;
    let mut result = Vec::new();
    for adjustment in adjustments {
        result.push(adjustment.to_command_model().await?);
    }
    Ok(result)
}

/// 繰り返し調整を削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_recurrence_adjustment(adjustment_id: String) -> Result<bool, String> {
    recurrence_facades::delete_recurrence_adjustment(adjustment_id).await
}

// =============================================================================
// 繰り返し詳細関連コマンド
// =============================================================================

/// 繰り返し詳細を作成します。
#[tracing::instrument]
#[tauri::command]
pub async fn create_recurrence_details(details: RecurrenceDetailsCommandModel) -> Result<bool, String> {
    let internal_details = details.to_model().await?;
    recurrence_facades::create_recurrence_details(internal_details).await
}

/// 繰り返しルールIDによる詳細を取得します。
#[tracing::instrument]
#[tauri::command]
pub async fn get_recurrence_details_by_rule_id(rule_id: String) -> Result<Option<RecurrenceDetailsCommandModel>, String> {
    let details = recurrence_facades::get_recurrence_details_by_rule_id(rule_id).await?;
    match details {
        Some(detail) => Ok(Some(detail.to_command_model().await?)),
        None => Ok(None),
    }
}

/// 繰り返し詳細を更新します。
#[tracing::instrument]
#[tauri::command]
pub async fn update_recurrence_details(details: RecurrenceDetailsCommandModel) -> Result<bool, String> {
    let internal_details = details.to_model().await?;
    recurrence_facades::update_recurrence_details(internal_details).await
}

/// 繰り返し詳細を削除します。
#[tracing::instrument]
#[tauri::command]
pub async fn delete_recurrence_details(details_id: String) -> Result<bool, String> {
    recurrence_facades::delete_recurrence_details(details_id).await
}
