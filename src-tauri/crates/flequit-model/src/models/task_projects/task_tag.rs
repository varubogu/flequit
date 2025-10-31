//! タスクタグ付け関係モデル
//!
//! このモジュールは、タスクとタグ間の関連付けを管理する
//! モデルを定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::traits::Trackable;

use crate::types::id_types::{TagId, TaskId, UserId};

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
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

impl Trackable for TaskTag {
    fn mark_created(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.created_at = timestamp;
        self.updated_at = timestamp;
        self.updated_by = user_id;
        self.deleted = false;
    }

    fn mark_updated(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_deleted(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.deleted = true;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn mark_restored(&mut self, user_id: UserId, timestamp: DateTime<Utc>) {
        self.deleted = false;
        self.updated_at = timestamp;
        self.updated_by = user_id;
    }

    fn is_deleted(&self) -> bool {
        self.deleted
    }

    fn get_updated_by(&self) -> UserId {
        self.updated_by
    }

    fn get_created_at(&self) -> DateTime<Utc> {
        self.created_at
    }

    fn get_updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }
}
