//! 割り当て関係モデル
//!
//! このモジュールは、タスクやサブタスクとユーザー間の割り当て関係を管理する
//! モデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::types::id_types::{SubTaskId, TaskId, UserId};

/// タスクとユーザーの割り当て関係を表現するモデル
///
/// タスクに対するユーザーの担当関係を管理します。
/// 一つのタスクに複数のユーザーを割り当て可能（多対多の関係）
///
/// # フィールド
///
/// * `task_id` - 割り当て対象のタスクID
/// * `user_id` - 割り当てられるユーザーID  
/// * `created_at` - 割り当て作成日時
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::assignment::TaskAssignment;
/// # use flequit_model::types::id_types::{TaskId, UserId};
/// # use chrono::Utc;
///
/// let assignment = TaskAssignment {
///     task_id: TaskId::from("task_123".to_string()),
///     user_id: UserId::from("user_456".to_string()),
///     created_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskAssignment {
    /// 割り当て対象のタスクID
    pub task_id: TaskId,
    /// 割り当てられるユーザーID
    pub user_id: UserId,
    /// 割り当て作成日時
    pub created_at: DateTime<Utc>,
}

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
/// # use flequit_model::models::assignment::SubtaskAssignment;
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
pub struct SubtaskAssignment {
    /// 割り当て対象のサブタスクID
    pub subtask_id: SubTaskId,
    /// 割り当てられるユーザーID
    pub user_id: UserId,
    /// 割り当て作成日時
    pub created_at: DateTime<Utc>,
}