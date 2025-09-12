use async_trait::async_trait;
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::types::id_types::{RecurrenceRuleId, TaskId};

use crate::project_relation_repository_trait::ProjectRelationRepository;

/// タスク繰り返しルール関連付けリポジトリのトレイト
///
/// タスクと繰り返しルール間の関連付けを管理するリポジトリ。
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
///
/// # 設計思想
///
/// - **関連管理**: タスクIDと繰り返しルールIDの組み合わせで管理
/// - **一対一関係**: 一つのタスクに一つの繰り返しルール
/// - **日時管理**: 関連付けの作成日時を記録
#[async_trait]
pub trait TaskRecurrenceRepositoryTrait:
    ProjectRelationRepository<TaskRecurrence, TaskId, RecurrenceRuleId> + Send + Sync
{
}
