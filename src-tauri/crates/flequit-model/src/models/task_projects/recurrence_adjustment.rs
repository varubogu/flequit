//! 繰り返しルール補正モデル
//!
//! このモジュールは繰り返しルール補正条件を管理する構造体を定義します。

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::traits::Trackable;

use crate::models::task_projects::date_condition::DateCondition;
use crate::models::task_projects::weekday_condition::WeekdayCondition;
use crate::types::id_types::UserId;

/// 繰り返しルール補正条件を表現する構造体
///
/// 日付条件と曜日条件を組み合わせて、繰り返しパターンの微調整を行います。
/// 複雑なビジネスルールや特殊な繰り返しパターンに対応します。
///
/// # フィールド
///
/// * `date_conditions` - 日付に基づく条件のリスト
/// * `weekday_conditions` - 曜日に基づく条件のリスト
///
/// # 処理順序
///
/// 1. 基本繰り返しルールでベース日付を計算
/// 2. 日付条件で適用可否を判定
/// 3. 曜日条件で最終調整を実行
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_model::models::recurrence_adjustment::RecurrenceAdjustment;
/// # use flequit_model::models::datetime_condition::{DateCondition, WeekdayCondition};
/// # use flequit_model::types::datetime_calendar_types::{DateRelation, DayOfWeek, AdjustmentDirection, AdjustmentTarget};
/// # use chrono::Utc;
///
/// let business_adjustment = RecurrenceAdjustment {
///     date_conditions: vec![
///         // 祝日回避条件
///         DateCondition {
///             id: "holiday_avoidance".to_string(),
///             relation: DateRelation::OnOrAfter,
///             reference_date: Utc::now(),
///         }
///     ],
///     weekday_conditions: vec![
///         // 土日は翌営業日に調整
///         WeekdayCondition {
///             id: "weekend_to_weekday".to_string(),
///             if_weekday: DayOfWeek::Saturday,
///             then_direction: AdjustmentDirection::Next,
///             then_target: AdjustmentTarget::Weekday,
///             then_weekday: Some(DayOfWeek::Monday),
///             then_days: None,
///         }
///     ],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceAdjustment {
    /// 日付に基づく条件のリスト
    pub date_conditions: Vec<DateCondition>,
    /// 曜日に基づく条件のリスト
    pub weekday_conditions: Vec<WeekdayCondition>,
    /// 補正条件作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

impl Trackable for RecurrenceAdjustment {
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
