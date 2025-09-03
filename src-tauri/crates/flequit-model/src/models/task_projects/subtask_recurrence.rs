//! サブタスク繰り返しルール関連付けモデル
//!
//! このモジュールは、サブタスクと繰り返しルール間の関連付けを管理する
//! モデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::types::id_types::SubTaskId;

/// 繰り返しルールID型定義
pub type RecurrenceRuleId = String;

/// サブタスクと繰り返しルールの関連付けを表現するモデル
///
/// サブタスクに対する繰り返しルールの紐づけ関係を管理します。
/// 一つのサブタスクに一つの繰り返しルールを関連付け（多対一の関係）
///
/// # フィールド
///
/// * `subtask_id` - 関連付け対象のサブタスクID
/// * `recurrence_rule_id` - 関連付ける繰り返しルールID
/// * `created_at` - 関連付け作成日時
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::subtask_recurrence::SubtaskRecurrence;
/// # use flequit_model::types::id_types::SubTaskId;
/// # use chrono::Utc;
///
/// let subtask_recurrence = SubtaskRecurrence {
///     subtask_id: SubTaskId::from("subtask_123".to_string()),
///     recurrence_rule_id: "rule_456".to_string(),
///     created_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SubTaskRecurrence {
    /// 関連付け対象のサブタスクID
    pub subtask_id: SubTaskId,
    /// 関連付ける繰り返しルールID
    pub recurrence_rule_id: RecurrenceRuleId,
    /// 関連付け作成日時
    pub created_at: DateTime<Utc>,
}
