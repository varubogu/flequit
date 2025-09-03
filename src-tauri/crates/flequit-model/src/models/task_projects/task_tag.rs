//! タスクタグ付け関係モデル
//!
//! このモジュールは、タスクとタグ間の関連付けを管理する
//! モデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::types::id_types::{TagId, TaskId};

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
/// # use flequit_model::models::task_tag::TaskTag;
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