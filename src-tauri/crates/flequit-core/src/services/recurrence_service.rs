//! 繰り返し関連サービス
//!
//! このモジュールは繰り返しルール、調整、詳細、タスク・サブタスク関連付けの
//! ビジネスロジックを処理します。

use chrono::Utc;
use crate::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::{
    recurrence_adjustment::RecurrenceAdjustment, recurrence_details::RecurrenceDetails,
    recurrence_rule::{PartialRecurrenceRule, RecurrenceRule},
    subtask_recurrence::SubTaskRecurrence,
    task_recurrence::TaskRecurrence,
};
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, SubTaskId, TaskId, UserId};
use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_types::errors::service_error::ServiceError;

// Command models are not available in core layer - using domain models directly

// =============================================================================
// 繰り返しルール関連サービス
// =============================================================================

/// 繰り返しルールを作成します。
pub async fn create_recurrence_rule<R>(
    repositories: &R,
    project_id: &ProjectId,
    rule: RecurrenceRule,
    user_id: &UserId,
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

    let now = Utc::now();
    repositories
        .recurrence_rules()
        .save(project_id, &rule, user_id, &now)
        .await
        .map_err(ServiceError::Repository)?;

    Ok(())
}

/// 繰り返しルールを取得します。
pub async fn get_recurrence_rule<R>(
    repositories: &R,
    project_id: &ProjectId,
    rule_id: &str,
) -> Result<Option<RecurrenceRule>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    let rule = repositories
        .recurrence_rules()
        .find_by_id(project_id, &RecurrenceRuleId::from(rule_id.to_string()))
        .await
        .map_err(ServiceError::Repository)?;

    // 実際のリポジトリ実装待ち
    Ok(rule)
}

/// すべての繰り返しルールを取得します。
pub async fn get_all_recurrence_rules<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<RecurrenceRule>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let rules = repositories
        .recurrence_rules()
        .find_all(project_id)
        .await
        .map_err(ServiceError::Repository)?;
    Ok(rules)
}

/// 繰り返しルールを更新します。
pub async fn update_recurrence_rule<R>(
    repositories: &R,
    project_id: &ProjectId,
    rule_id: &RecurrenceRuleId,
    patch: &PartialRecurrenceRule,
    user_id: &UserId,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let now = Utc::now();
    Ok(repositories
        .recurrence_rules()
        .patch(project_id, rule_id, patch, user_id, &now)
        .await?)
}

/// 繰り返しルールを削除します。
pub async fn delete_recurrence_rule<R>(
    repositories: &R,
    project_id: &ProjectId,
    rule_id: &str,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .recurrence_rules()
        .delete(project_id, &RecurrenceRuleId::from(rule_id.to_string()))
        .await
        .map_err(ServiceError::Repository)?;

    Ok(())
}

// =============================================================================
// 繰り返し調整関連サービス
// =============================================================================

/// 繰り返し調整を作成します。
pub async fn create_recurrence_adjustment<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _adjustment: RecurrenceAdjustment,
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
    _repositories: &R,
    _project_id: &ProjectId,
    _rule_id: &str,
) -> Result<Vec<RecurrenceAdjustment>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 仮実装
    Ok(vec![])
}

/// 繰り返し調整を削除します。
pub async fn delete_recurrence_adjustment<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _adjustment_id: &str,
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
    _repositories: &R,
    _project_id: &ProjectId,
    _details: RecurrenceDetails,
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
    _repositories: &R,
    _project_id: &ProjectId,
    _rule_id: &str,
) -> Result<Option<RecurrenceDetails>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 仮実装
    Ok(None)
}

/// 繰り返し詳細を更新します。
pub async fn update_recurrence_details<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _details: RecurrenceDetails,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 実際のリポジトリ実装待ち
    Ok(())
}

/// 繰り返し詳細を削除します。
pub async fn delete_recurrence_details<R>(
    _repositories: &R,
    _project_id: &ProjectId,
    _details_id: &RecurrenceRuleId,
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
    project_id: &ProjectId,
    task_id: &TaskId,
    recurrence_rule_id: &RecurrenceRuleId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let now = Utc::now();
    let user_id = UserId::from("system");

    // タスク・繰り返しルール関連付けを保存
    repositories
        .task_recurrences()
        .add(project_id, task_id, recurrence_rule_id, &user_id, &now)
        .await
        .map_err(ServiceError::Repository)?;

    Ok(())
}

/// タスクIDによる繰り返し関連付けを取得します。
pub async fn get_task_recurrence_by_task_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<Option<TaskRecurrence>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // find_relationsを使用して、タスクIDに関連する最初の繰り返し関連付けを取得
    let relations = repositories
        .task_recurrences()
        .find_relations(project_id, task_id)
        .await
        .map_err(ServiceError::Repository)?;

    Ok(relations.into_iter().next())
}

/// タスクの繰り返し関連付けを削除します。
pub async fn delete_task_recurrence<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_id: &TaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .task_recurrences()
        .remove_all(project_id, task_id)
        .await
        .map_err(ServiceError::Repository)?;

    Ok(())
}

// =============================================================================
// サブタスク繰り返し関連付けサービス
// =============================================================================

/// サブタスクに繰り返しルールを関連付けます。
pub async fn create_subtask_recurrence<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
    recurrence_rule_id: &RecurrenceRuleId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let now = Utc::now();
    let user_id = UserId::from("system");

    // サブタスク・繰り返しルール関連付けを保存
    repositories
        .subtask_recurrences()
        .add(project_id, subtask_id, recurrence_rule_id, &user_id, &now)
        .await
        .map_err(ServiceError::Repository)?;

    Ok(())
}

/// サブタスクIDによる繰り返し関連付けを取得します。
pub async fn get_subtask_recurrence_by_subtask_id<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<Option<SubTaskRecurrence>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // find_relationsを使用して、サブタスクIDに関連する最初の繰り返し関連付けを取得
    let relations = repositories
        .subtask_recurrences()
        .find_relations(project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)?;

    Ok(relations.into_iter().next())
}

/// サブタスクの繰り返し関連付けを削除します。
pub async fn delete_subtask_recurrence<R>(
    repositories: &R,
    project_id: &ProjectId,
    subtask_id: &SubTaskId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories
        .subtask_recurrences()
        .remove_all(project_id, subtask_id)
        .await
        .map_err(ServiceError::Repository)?;

    Ok(())
}
