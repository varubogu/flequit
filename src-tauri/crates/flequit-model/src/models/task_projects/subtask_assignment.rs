use crate::types::id_types::{SubTaskId, UserId};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::traits::Trackable;

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
/// # use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
/// # use flequit_model::types::id_types::{SubTaskId, UserId};
/// # use chrono::Utc;
///
/// let assignment = SubTaskAssignment {
///     subtask_id: SubTaskId::from("subtask_123".to_string()),
///     user_id: UserId::from("user_456".to_string()),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::new(),
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
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

impl Trackable for SubTaskAssignment {
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
