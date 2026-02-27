//! サブタスク繰り返しルール関連付けモデル
//!
//! このモジュールは、サブタスクと繰り返しルール間の関連付けを管理する
//! モデルを定義します。

use crate::traits::Trackable;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::types::id_types::{RecurrenceRuleId, SubTaskId, UserId};

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
/// # use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
/// # use flequit_model::types::id_types::{RecurrenceRuleId, SubTaskId, UserId};
/// # use chrono::Utc;
///
/// let subtask_recurrence = SubTaskRecurrence {
///     subtask_id: SubTaskId::from("subtask_123".to_string()),
///     recurrence_rule_id: RecurrenceRuleId::from("rule_456"),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::new(),
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
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

impl Trackable for SubTaskRecurrence {
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
