//! 曜日条件モデル
//!
//! このモジュールは曜日に基づく条件調整を管理する構造体を定義します。

use crate::types::{
    datetime_calendar_types::{AdjustmentDirection, AdjustmentTarget, DayOfWeek},
    id_types::WeekdayConditionId,
};
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
/// # use flequit_model::models::weekday_condition::WeekdayCondition;
/// # use flequit_model::types::datetime_calendar_types::{DayOfWeek, AdjustmentDirection, AdjustmentTarget};
///
/// // 土曜日なら翌営業日（月曜日）に調整
/// let weekend_adjustment = WeekdayCondition {
///     id: "saturday_to_monday".to_string(),
///     if_weekday: DayOfWeek::Saturday,
///     then_direction: AdjustmentDirection::Next,
///     then_target: AdjustmentTarget::Weekday,
///     then_weekday: Some(DayOfWeek::Monday),
///     then_days: None,
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
}
