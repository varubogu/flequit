use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

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

// 日付条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateCondition {
    pub id: String,
    pub relation: DateRelation,
    pub reference_date: DateTime<Utc>,
}

// 曜日条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekdayCondition {
    pub id: String,
    pub if_weekday: DayOfWeek,
    pub then_direction: AdjustmentDirection,
    pub then_target: AdjustmentTarget,
    pub then_weekday: Option<DayOfWeek>,
    pub then_days: Option<i32>,
}

// 補正条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceAdjustment {
    pub date_conditions: Vec<DateCondition>,
    pub weekday_conditions: Vec<WeekdayCondition>,
}

// 繰り返し詳細設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceDetails {
    pub specific_date: Option<i32>,
    pub week_of_period: Option<WeekOfMonth>,
    pub weekday_of_week: Option<DayOfWeek>,
    pub date_conditions: Option<Vec<DateCondition>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceRule {
    pub unit: RecurrenceUnit,
    pub interval: i32,
    pub days_of_week: Option<Vec<DayOfWeek>>,
    pub details: Option<RecurrenceDetails>,
    pub adjustment: Option<RecurrenceAdjustment>,
    pub end_date: Option<DateTime<Utc>>,
    pub max_occurrences: Option<i32>,
}