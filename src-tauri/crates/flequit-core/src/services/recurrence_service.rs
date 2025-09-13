//! 繰り返し関連サービス
//!
//! このモジュールは繰り返しルール、調整、詳細、タスク・サブタスク関連付けの
//! ビジネスロジックを処理します。

use chrono::Utc;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::{
    recurrence_adjustment::RecurrenceAdjustment, recurrence_details::RecurrenceDetails,
    recurrence_rule::RecurrenceRule, subtask_recurrence::SubTaskRecurrence,
    task_recurrence::TaskRecurrence,
};
use flequit_model::types::id_types::{RecurrenceRuleId, SubTaskId, TaskId};
use flequit_types::errors::service_error::ServiceError;

// Command models are not available in core layer - using domain models directly

// =============================================================================
// 繰り返しルール関連サービス
// =============================================================================

/// 繰り返しルールを作成します。

pub async fn create_recurrence_rule<R>(
    repositories: &R,
    rule: RecurrenceRule,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // バリデーション
    if rule.interval <= 0 {
        return Err(ServiceError::ValidationError(
            "繰り返し間隔は1以上である必要があります".to_string(),
        ));
    }

    // max_occurrencesが指定されている場合、正の値である必要がある
    if let Some(max) = rule.max_occurrences {
        if max <= 0 {
            return Err(ServiceError::ValidationError(
                "最大回数は1以上である必要があります".to_string(),
            ));
        }
    }

    // 保存（実際のリポジトリ実装待ち）
    // repositories.recurrence_rules.save(&rule).await
    //     .map_err(|e| ServiceError::RepositoryError(e))?;

    Ok(())
}

/// 繰り返しルールを取得します。

pub async fn get_recurrence_rule<R>(
    repositories: &R,
    rule_id: &str,
) -> Result<Option<RecurrenceRule>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    // let rule = repositories.recurrence_rules.find_by_id(rule_id).await
    //     .map_err(|e| ServiceError::RepositoryError(e))?;

    // モデルからCommandへ変換
    // Ok(rule.map(|r| RecurrenceRuleCommand {
    //     id: r.id,
    //     name: r.name,
    //     pattern: r.pattern,
    //     is_active: r.is_active,
    // }))

    // 仮実装
    Ok(None)
}

/// すべての繰り返しルールを取得します。

pub async fn get_all_recurrence_rules<R>(
    repositories: &R,
) -> Result<Vec<RecurrenceRule>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    // let rules = repositories.recurrence_rules.find_all().await
    //     .map_err(|e| ServiceError::RepositoryError(e))?;

    // モデルからCommandへ変換
    // Ok(rules.into_iter().map(|r| RecurrenceRuleCommand {
    //     id: r.id,
    //     name: r.name,
    //     pattern: r.pattern,
    //     is_active: r.is_active,
    // }).collect())

    // 仮実装
    Ok(vec![])
}

/// 繰り返しルールを更新します。

pub async fn update_recurrence_rule<R>(
    repositories: &R,
    rule: RecurrenceRule,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // バリデーション
    if rule.interval <= 0 {
        return Err(ServiceError::ValidationError(
            "繰り返し間隔は1以上である必要があります".to_string(),
        ));
    }

    // max_occurrencesが指定されている場合、正の値である必要がある
    if let Some(max) = rule.max_occurrences {
        if max <= 0 {
            return Err(ServiceError::ValidationError(
                "最大回数は1以上である必要があります".to_string(),
            ));
        }
    }

    // 実際のリポジトリ実装待ち
    Ok(())
}

/// 繰り返しルールを削除します。

pub async fn delete_recurrence_rule<R>(repositories: &R, rule_id: &str) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    // repositories.recurrence_rules.delete(rule_id).await
    //     .map_err(|e| ServiceError::RepositoryError(e))?;

    Ok(())
}

// =============================================================================
// 繰り返し調整関連サービス
// =============================================================================

/// 繰り返し調整を作成します。

pub async fn create_recurrence_adjustment<R>(
    repositories: &R,
    adjustment: RecurrenceAdjustment,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // RecurrenceAdjustmentにはcreated_atフィールドが存在しないため、この処理は不要

    // 実際のリポジトリ実装待ち
    Ok(())
}

/// 繰り返しルールIDによる調整一覧を取得します。

pub async fn get_recurrence_adjustments_by_rule_id<R>(
    repositories: &R,
    rule_id: &str,
) -> Result<Vec<RecurrenceAdjustment>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 仮実装
    Ok(vec![])
}

/// 繰り返し調整を削除します。

pub async fn delete_recurrence_adjustment<R>(
    repositories: &R,
    adjustment_id: &str,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    Ok(())
}

// =============================================================================
// 繰り返し詳細関連サービス
// =============================================================================

/// 繰り返し詳細を作成します。

pub async fn create_recurrence_details<R>(
    repositories: &R,
    details: RecurrenceDetails,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // RecurrenceDetailsにはcreated_at, updated_atフィールドが存在しないため、この処理は不要

    // 実際のリポジトリ実装待ち
    Ok(())
}

/// 繰り返しルールIDによる詳細を取得します。

pub async fn get_recurrence_details_by_rule_id<R>(
    repositories: &R,
    rule_id: &str,
) -> Result<Option<RecurrenceDetails>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 仮実装
    Ok(None)
}

/// 繰り返し詳細を更新します。

pub async fn update_recurrence_details<R>(
    repositories: &R,
    details: RecurrenceDetails,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    Ok(())
}

/// 繰り返し詳細を削除します。

pub async fn delete_recurrence_details<R>(
    repositories: &R,
    details_id: &str,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    Ok(())
}

// =============================================================================
// タスク繰り返し関連付けサービス
// =============================================================================

/// タスクに繰り返しルールを関連付けます。

pub async fn create_task_recurrence<R>(
    repositories: &R,
    task_id: &TaskId,
    recurrence_rule_id: &str,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let _task_recurrence = TaskRecurrence {
        task_id: task_id.clone(),
        recurrence_rule_id: RecurrenceRuleId::from(recurrence_rule_id.to_string()),
        created_at: Utc::now(),
    };

    // 実際のリポジトリ実装待ち
    Ok(())
}

/// タスクIDによる繰り返し関連付けを取得します。

pub async fn get_task_recurrence_by_task_id<R>(
    repositories: &R,
    task_id: &TaskId,
) -> Result<Option<TaskRecurrence>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 仮実装
    Ok(None)
}

/// タスクの繰り返し関連付けを削除します。

pub async fn delete_task_recurrence<R>(
    repositories: &R,
    task_id: &TaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    Ok(())
}

// =============================================================================
// サブタスク繰り返し関連付けサービス
// =============================================================================

/// サブタスクに繰り返しルールを関連付けます。

pub async fn create_subtask_recurrence<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
    recurrence_rule_id: &str,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let _subtask_recurrence = SubTaskRecurrence {
        subtask_id: subtask_id.clone(),
        recurrence_rule_id: RecurrenceRuleId::from(recurrence_rule_id.to_string()),
        created_at: Utc::now(),
    };

    // 実際のリポジトリ実装待ち
    Ok(())
}

/// サブタスクIDによる繰り返し関連付けを取得します。

pub async fn get_subtask_recurrence_by_subtask_id<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
) -> Result<Option<SubTaskRecurrence>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 仮実装
    Ok(None)
}

/// サブタスクの繰り返し関連付けを削除します。

pub async fn delete_subtask_recurrence<R>(
    repositories: &R,
    subtask_id: &SubTaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    Ok(())
}
