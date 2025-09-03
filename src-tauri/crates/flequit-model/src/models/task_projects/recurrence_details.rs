//! 繰り返し詳細設定モデル
//!
//! このモジュールは繰り返しパターンの詳細設定を管理する構造体を定義します。

use crate::models::task_projects::date_condition::DateCondition;

use crate::types::datetime_calendar_types::{DayOfWeek, WeekOfMonth};
use serde::{Deserialize, Serialize};

/// 繰り返しパターンの詳細設定を表現する構造体
///
/// 基本的な繰り返し周期に加えて、より具体的な発生パターンを定義します。
/// 月の特定日、特定週の特定曜日など、複雑な繰り返しパターンに対応します。
///
/// # フィールド
///
/// * `specific_date` - 月の特定日（1-31、月次繰り返し時）
/// * `week_of_period` - 期間内の特定週（第1週、最終週等）
/// * `weekday_of_week` - 週の特定曜日
/// * `date_conditions` - 追加の日付条件
///
/// # パターン例
///
/// ## 毎月第2火曜日
/// ```rust,no_run
/// # use flequit_model::models::recurrence_details::RecurrenceDetails;
/// # use flequit_model::types::datetime_calendar_types::{WeekOfMonth, DayOfWeek};
///
/// let second_tuesday = RecurrenceDetails {
///     specific_date: None,
///     week_of_period: Some(WeekOfMonth::Second),
///     weekday_of_week: Some(DayOfWeek::Tuesday),
///     date_conditions: None,
/// };
/// ```
///
/// ## 毎月15日
/// ```rust,no_run
/// # use flequit_model::models::recurrence_details::RecurrenceDetails;
///
/// let fifteenth_day = RecurrenceDetails {
///     specific_date: Some(15),
///     week_of_period: None,
///     weekday_of_week: None,
///     date_conditions: None,
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceDetails {
    /// 月の特定日（1-31、月次繰り返し時）
    pub specific_date: Option<i32>,
    /// 期間内の特定週（第1週、最終週等）
    pub week_of_period: Option<WeekOfMonth>,
    /// 週の特定曜日
    pub weekday_of_week: Option<DayOfWeek>,
    /// 追加の日付条件
    pub date_conditions: Option<Vec<DateCondition>>,
}
