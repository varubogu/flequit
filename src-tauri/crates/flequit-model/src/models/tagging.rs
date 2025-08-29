//! タグ付け関係モデル  
//!
//! このモジュールは、タスクやサブタスクとタグ間の関連付けを管理する
//! モデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::types::id_types::{SubTaskId, TagId, TaskId};

/// タスクとタグの関連付けを表現するモデル
///
/// タスクに対するタグの紐づけ関係を管理します。
/// 一つのタスクに複数のタグを関連付け可能（多対多の関係）
///
/// # フィールド
///
/// * `task_id` - タグ付け対象のタスクID
/// * `tag_id` - 関連付けるタグID  
/// * `created_at` - タグ付け作成日時
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::tagging::TaskTag;
/// # use flequit_model::types::id_types::{TaskId, TagId};
/// # use chrono::Utc;
///
/// let task_tag = TaskTag {
///     task_id: TaskId::from("task_123".to_string()),
///     tag_id: TagId::from("tag_456".to_string()),
///     created_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TaskTag {
    /// タグ付け対象のタスクID
    pub task_id: TaskId,
    /// 関連付けるタグID
    pub tag_id: TagId,
    /// タグ付け作成日時
    pub created_at: DateTime<Utc>,
}

/// サブタスクとタグの関連付けを表現するモデル
///
/// サブタスクに対するタグの紐づけ関係を管理します。
/// 一つのサブタスクに複数のタグを関連付け可能（多対多の関係）
///
/// # フィールド
///
/// * `subtask_id` - タグ付け対象のサブタスクID
/// * `tag_id` - 関連付けるタグID  
/// * `created_at` - タグ付け作成日時
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::tagging::SubtaskTag;
/// # use flequit_model::types::id_types::{SubTaskId, TagId};
/// # use chrono::Utc;
///
/// let subtask_tag = SubtaskTag {
///     subtask_id: SubTaskId::from("subtask_123".to_string()),
///     tag_id: TagId::from("tag_456".to_string()),
///     created_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SubtaskTag {
    /// タグ付け対象のサブタスクID
    pub subtask_id: SubTaskId,
    /// 関連付けるタグID
    pub tag_id: TagId,
    /// タグ付け作成日時
    pub created_at: DateTime<Utc>,
}