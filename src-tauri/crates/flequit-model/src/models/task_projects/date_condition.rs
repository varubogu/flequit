//! 日付条件モデル
//!
//! このモジュールは日付に基づく条件を管理する構造体を定義します。

use crate::traits::Trackable;
use crate::types::{
    datetime_calendar_types::DateRelation,
    id_types::{DateConditionId, UserId},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 日付に基づく条件を表現する構造体
///
/// 特定の基準日に対する相対的な関係性を定義し、
/// 繰り返しルールの適用条件や調整条件として使用されます。
///
/// # フィールド
///
/// * `id` - 条件の一意識別子
/// * `relation` - 基準日との関係性（前、後、同じ等）
/// * `reference_date` - 比較基準となる日付
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::task_projects::date_condition::DateCondition;
/// # use flequit_model::types::datetime_calendar_types::DateRelation;
/// # use flequit_model::types::id_types::{DateConditionId, UserId};
///
/// // 特定日以降の条件
/// let after_condition = DateCondition {
///     id: DateConditionId::new(),
///     relation: DateRelation::After,
///     reference_date: "2024-01-01T00:00:00Z".parse().unwrap(),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::new(),
/// };
/// ```
///
/// # 使用場面
///
/// - 期間限定タスクの適用条件
/// - 季節的なタスクの開始・終了条件
/// - 祝日回避などの調整条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateCondition {
    /// 条件の一意識別子
    pub id: DateConditionId,
    /// 基準日との関係性（前、後、同じ等）
    pub relation: DateRelation,
    /// 比較基準となる日付
    pub reference_date: DateTime<Utc>,
    /// 条件作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

impl Trackable for DateCondition {
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
