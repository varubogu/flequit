//! 繰り返し関連ファサード
//!
//! このモジュールは繰り返しルール、調整、詳細、タスク・サブタスク関連付けの
//! Service層とのインターフェースを提供します。

use crate::services::recurrence_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::{
    models::task_projects::{
        recurrence_adjustment::RecurrenceAdjustment, recurrence_details::RecurrenceDetails,
        recurrence_rule::RecurrenceRule, subtask_recurrence::SubTaskRecurrence,
        task_recurrence::TaskRecurrence,
    },
    types::id_types::{SubTaskId, TaskId},
};
use flequit_types::errors::service_error::ServiceError;

// 実際のドメインモデルを使用（Commandモデルは削除）
// TODO: 繰り返しファサードで使用すべき適切なドメインモデルを確認して置換

// =============================================================================
// 繰り返しルール関連ファサード
// =============================================================================

/// 繰り返しルールを作成します。
#[tracing::instrument(level = "trace")]
pub async fn create_recurrence_rule<R>(
    repositories: &R,
    rule: RecurrenceRule,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::create_recurrence_rule(repositories, rule).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create recurrence rule: {:?}", e)),
    }
}

/// 繰り返しルールを取得します。
#[tracing::instrument(level = "trace")]
pub async fn get_recurrence_rule<R>(
    repositories: &R,
    rule_id: String,
) -> Result<Option<RecurrenceRule>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::get_recurrence_rule(repositories, &rule_id).await {
        Ok(rule) => Ok(rule),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get recurrence rule: {:?}", e)),
    }
}

/// すべての繰り返しルールを取得します。
#[tracing::instrument(level = "trace")]
pub async fn get_all_recurrence_rules<R>(repositories: &R) -> Result<Vec<RecurrenceRule>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::get_all_recurrence_rules(repositories).await {
        Ok(rules) => Ok(rules),
        Err(e) => Err(format!("Failed to get all recurrence rules: {:?}", e)),
    }
}

/// 繰り返しルールを更新します。
#[tracing::instrument(level = "trace")]
pub async fn update_recurrence_rule<R>(
    repositories: &R,
    rule: RecurrenceRule,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::update_recurrence_rule(repositories, rule).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update recurrence rule: {:?}", e)),
    }
}

/// 繰り返しルールを削除します。
#[tracing::instrument(level = "trace")]
pub async fn delete_recurrence_rule<R>(repositories: &R, rule_id: String) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::delete_recurrence_rule(repositories, &rule_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete recurrence rule: {:?}", e)),
    }
}

// =============================================================================
// 繰り返し調整関連ファサード
// =============================================================================

/// 繰り返し調整を作成します。
#[tracing::instrument(level = "trace")]
pub async fn create_recurrence_adjustment<R>(
    repositories: &R,
    adjustment: RecurrenceAdjustment,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::create_recurrence_adjustment(repositories, adjustment).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create recurrence adjustment: {:?}", e)),
    }
}

/// 繰り返しルールIDによる調整一覧を取得します。
#[tracing::instrument(level = "trace")]
pub async fn get_recurrence_adjustments_by_rule_id<R>(
    repositories: &R,
    rule_id: String,
) -> Result<Vec<RecurrenceAdjustment>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::get_recurrence_adjustments_by_rule_id(repositories, &rule_id).await {
        Ok(adjustments) => Ok(adjustments),
        Err(e) => Err(format!("Failed to get recurrence adjustments: {:?}", e)),
    }
}

/// 繰り返し調整を削除します。
#[tracing::instrument(level = "trace")]
pub async fn delete_recurrence_adjustment<R>(
    repositories: &R,
    adjustment_id: String,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::delete_recurrence_adjustment(repositories, &adjustment_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete recurrence adjustment: {:?}", e)),
    }
}

// =============================================================================
// 繰り返し詳細関連ファサード
// =============================================================================

/// 繰り返し詳細を作成します。
#[tracing::instrument(level = "trace")]
pub async fn create_recurrence_details<R>(
    repositories: &R,
    details: RecurrenceDetails,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::create_recurrence_details(repositories, details).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create recurrence details: {:?}", e)),
    }
}

/// 繰り返しルールIDによる詳細を取得します。
#[tracing::instrument(level = "trace")]
pub async fn get_recurrence_details_by_rule_id<R>(
    repositories: &R,
    rule_id: String,
) -> Result<Option<RecurrenceDetails>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::get_recurrence_details_by_rule_id(repositories, &rule_id).await {
        Ok(details) => Ok(details),
        Err(e) => Err(format!("Failed to get recurrence details: {:?}", e)),
    }
}

/// 繰り返し詳細を更新します。
#[tracing::instrument(level = "trace")]
pub async fn update_recurrence_details<R>(
    repositories: &R,
    details: RecurrenceDetails,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::update_recurrence_details(repositories, details).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update recurrence details: {:?}", e)),
    }
}

/// 繰り返し詳細を削除します。
#[tracing::instrument(level = "trace")]
pub async fn delete_recurrence_details<R>(
    repositories: &R,
    details_id: String,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::delete_recurrence_details(repositories, &details_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete recurrence details: {:?}", e)),
    }
}

// =============================================================================
// タスク繰り返し関連付けファサード
// =============================================================================

/// タスクに繰り返しルールを関連付けます。
#[tracing::instrument(level = "trace")]
pub async fn create_task_recurrence<R>(
    repositories: &R,
    task_id: &TaskId,
    recurrence_rule_id: &str,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::create_task_recurrence(repositories, task_id, recurrence_rule_id)
        .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create task recurrence: {:?}", e)),
    }
}

/// タスクIDによる繰り返し関連付けを取得します。
#[tracing::instrument(level = "trace")]
pub async fn get_task_recurrence_by_task_id<R>(
    repositories: &R,
    task_id: &TaskId,
) -> Result<Option<TaskRecurrence>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::get_task_recurrence_by_task_id(repositories, task_id).await {
        Ok(task_recurrence) => Ok(task_recurrence),
        Err(e) => Err(format!("Failed to get task recurrence: {:?}", e)),
    }
}

/// タスクの繰り返し関連付けを削除します。
#[tracing::instrument(level = "trace")]
pub async fn delete_task_recurrence<R>(repositories: &R, task_id: &TaskId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::delete_task_recurrence(repositories, task_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete task recurrence: {:?}", e)),
    }
}

// =============================================================================
// サブタスク繰り返し関連付けファサード
// =============================================================================

/// サブタスクに繰り返しルールを関連付けます。
#[tracing::instrument(level = "trace")]
pub async fn create_subtask_recurrence<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
    recurrence_rule_id: &str,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::create_subtask_recurrence(
        repositories,
        subtask_id,
        recurrence_rule_id,
    )
    .await
    {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create subtask recurrence: {:?}", e)),
    }
}

/// サブタスクIDによる繰り返し関連付けを取得します。
#[tracing::instrument(level = "trace")]
pub async fn get_subtask_recurrence_by_subtask_id<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
) -> Result<Option<SubTaskRecurrence>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::get_subtask_recurrence_by_subtask_id(repositories, subtask_id).await {
        Ok(subtask_recurrence) => Ok(subtask_recurrence),
        Err(e) => Err(format!("Failed to get subtask recurrence: {:?}", e)),
    }
}

/// サブタスクの繰り返し関連付けを削除します。
#[tracing::instrument(level = "trace")]
pub async fn delete_subtask_recurrence<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match recurrence_service::delete_subtask_recurrence(repositories, subtask_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete subtask recurrence: {:?}", e)),
    }
}
