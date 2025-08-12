use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::super::types::datetime_calendar_types::{DateRelation, DayOfWeek, AdjustmentDirection, AdjustmentTarget, WeekOfMonth, RecurrenceUnit};

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