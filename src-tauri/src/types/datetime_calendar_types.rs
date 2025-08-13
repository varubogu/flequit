//! 日付、時刻、カレンダー、および繰り返し設定に関連する型を定義します。
use serde::{Deserialize, Serialize};

/// 繰り返しタスクの単位を示します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecurrenceUnit {
    /// 分単位
    Minute,
    /// 時間単位
    Hour,
    /// 日単位
    Day,
    /// 週単位
    Week,
    /// 月単位
    Month,
    /// 四半期単位
    Quarter,
    /// 半年単位
    HalfYear,
    /// 年単位
    Year,
}

/// 繰り返しのレベルを示します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecurrenceLevel {
    /// 繰り返しなし
    Disabled,
    /// 基本的な繰り返し
    Enabled,
    /// 高度な繰り返し設定
    Advanced,
}

/// 曜日を示します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DayOfWeek {
    /// 日曜日
    Sunday,
    /// 月曜日
    Monday,
    /// 火曜日
    Tuesday,
    /// 水曜日
    Wednesday,
    /// 木曜日
    Thursday,
    /// 金曜日
    Friday,
    /// 土曜日
    Saturday,
}

/// 月の週を示します（例: 第1週、最終週）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WeekOfMonth {
    /// 第1週
    First,
    /// 第2週
    Second,
    /// 第3週
    Third,
    /// 第4週
    Fourth,
    /// 最終週
    Last,
}

/// 日付の相対的な関係を示します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DateRelation {
    /// 指定日より前
    Before,
    /// 指定日以前
    OnOrBefore,
    /// 指定日以降
    OnOrAfter,
    /// 指定日より後
    After,
}

/// 日付調整の方向を示します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AdjustmentDirection {
    /// 前の日
    Previous,
    /// 次の日
    Next,
}

/// 日付調整の対象となる日の種類を示します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AdjustmentTarget {
    /// 平日
    Weekday,
    /// 週末
    Weekend,
    /// 祝日
    Holiday,
    /// 祝日でない日
    NonHoliday,
    /// 週末のみ
    WeekendOnly,
    /// 平日のみ
    NonWeekend,
    /// 週末または祝日
    WeekendHoliday,
    /// 週末でも祝日でもない日
    NonWeekendHoliday,
    /// 特定の曜日
    SpecificWeekday,
}