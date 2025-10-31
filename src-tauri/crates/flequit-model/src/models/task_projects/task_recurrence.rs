//! タスク繰り返しルール関連付けモデル
//!
//! このモジュールは、タスクと繰り返しルール間の関連付けを管理する
//! モデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::types::id_types::{RecurrenceRuleId, TaskId, UserId};

/// タスクと繰り返しルールの関連付けを表現するモデル
///
/// タスクに対する繰り返しルールの紐づけ関係を管理します。
/// 一つのタスクに一つの繰り返しルールを関連付け（多対一の関係）
///
/// # フィールド
///
/// * `task_id` - 関連付け対象のタスクID
/// * `recurrence_rule_id` - 関連付ける繰り返しルールID
/// * `created_at` - 関連付け作成日時
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::task_recurrence::TaskRecurrence;
/// # use flequit_model::types::id_types::TaskId;
/// # use chrono::Utc;
///
/// let task_recurrence = TaskRecurrence {
///     task_id: TaskId::from("task_123".to_string()),
///     recurrence_rule_id: "rule_456".to_string(),
///     created_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskRecurrence {
    /// 関連付け対象のタスクID
    pub task_id: TaskId,
    /// 関連付ける繰り返しルールID
    pub recurrence_rule_id: RecurrenceRuleId,
    /// 関連付け作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}
