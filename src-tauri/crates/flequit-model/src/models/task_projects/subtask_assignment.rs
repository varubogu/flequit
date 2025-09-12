use crate::types::id_types::{SubTaskId, UserId};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// サブタスクとユーザーの割り当て関係を表現するモデル
///
/// サブタスクに対するユーザーの担当関係を管理します。
/// 一つのサブタスクに複数のユーザーを割り当て可能（多対多の関係）
///
/// # フィールド
///
/// * `subtask_id` - 割り当て対象のサブタスクID
/// * `user_id` - 割り当てられるユーザーID
/// * `created_at` - 割り当て作成日時
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::subtask_assignment::SubtaskAssignment;
/// # use flequit_model::types::id_types::{SubTaskId, UserId};
/// # use chrono::Utc;
///
/// let assignment = SubtaskAssignment {
///     subtask_id: SubTaskId::from("subtask_123".to_string()),
///     user_id: UserId::from("user_456".to_string()),
///     created_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SubTaskAssignment {
    /// 割り当て対象のサブタスクID
    pub subtask_id: SubTaskId,
    /// 割り当てられるユーザーID
    pub user_id: UserId,
    /// 割り当て作成日時
    pub created_at: DateTime<Utc>,
}
