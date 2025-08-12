use serde::{Deserialize, Serialize};

// 繰り返し機能の型定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecurrenceUnit {
    Minute,
    Hour,
    Day,
    Week,
    Month,
    Quarter,
    HalfYear,
    Year,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecurrenceLevel {
    Disabled,
    Enabled,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DayOfWeek {
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WeekOfMonth {
    First,
    Second,
    Third,
    Fourth,
    Last,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DateRelation {
    Before,
    OnOrBefore,
    OnOrAfter,
    After,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AdjustmentDirection {
    Previous,
    Next,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AdjustmentTarget {
    Weekday,
    Weekend,
    Holiday,
    NonHoliday,
    WeekendOnly,
    NonWeekend,
    WeekendHoliday,
    NonWeekendHoliday,
    SpecificWeekday,
}

