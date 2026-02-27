//! 曜日条件モデル
//!
//! このモジュールは曜日に基づく条件調整を管理する構造体を定義します。

use crate::traits::Trackable;
use crate::types::{
    datetime_calendar_types::{AdjustmentDirection, AdjustmentTarget, DayOfWeek},
    id_types::{UserId, WeekdayConditionId},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 曜日に基づく条件調整を表現する構造体
///
/// 指定された曜日に該当する場合の日付調整ルールを定義します。
/// ビジネス日への調整や曜日固定のタスク管理に使用されます。
///
/// # フィールド
///
/// * `id` - 条件の一意識別子
/// * `if_weekday` - 判定対象の曜日
/// * `then_direction` - 調整方向（前・後・最近等）
/// * `then_target` - 調整対象（平日・特定曜日・日数等）
/// * `then_weekday` - 調整先の曜日（target=特定曜日の場合）
/// * `then_days` - 調整日数（target=日数の場合）
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
/// # use flequit_model::types::datetime_calendar_types::{DayOfWeek, AdjustmentDirection, AdjustmentTarget};
/// # use flequit_model::types::id_types::{UserId, WeekdayConditionId};
///
/// // 土曜日なら翌営業日（月曜日）に調整
/// let weekend_adjustment = WeekdayCondition {
///     id: WeekdayConditionId::new(),
///     if_weekday: DayOfWeek::Saturday,
///     then_direction: AdjustmentDirection::Next,
///     then_target: AdjustmentTarget::Weekday,
///     then_weekday: Some(DayOfWeek::Monday),
///     then_days: None,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
///     deleted: false,
///     updated_by: UserId::new(),
/// };
/// ```
///
/// # 使用場面
///
/// - 営業日調整（土日祝日回避）
/// - 定期会議の曜日固定
/// - 月末処理の平日調整
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekdayCondition {
    /// 条件の一意識別子
    pub id: WeekdayConditionId,
    /// 判定対象の曜日
    pub if_weekday: DayOfWeek,
    /// 調整方向（前・後・最近等）
    pub then_direction: AdjustmentDirection,
    /// 調整対象（平日・特定曜日・日数等）
    pub then_target: AdjustmentTarget,
    /// 調整先の曜日（target=特定曜日の場合）
    pub then_weekday: Option<DayOfWeek>,
    /// 調整日数（target=日数の場合）
    pub then_days: Option<i32>,
    /// 条件作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
    /// 論理削除フラグ（Automerge同期用）
    pub deleted: bool,
    /// 最終更新者のユーザーID（必須、作成・更新・削除・復元すべての操作で記録）
    pub updated_by: UserId,
}

impl Trackable for WeekdayCondition {
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
