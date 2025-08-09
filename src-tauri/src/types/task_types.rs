use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// TaskStatusをSvelte側に合わせて修正
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    NotStarted,
    InProgress,
    Waiting,
    Completed,
    Cancelled,
}

// 繰り返し機能の型定義
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
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
#[serde(rename_all = "snake_case")]
pub enum RecurrenceLevel {
    Disabled,
    Enabled,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
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
#[serde(rename_all = "snake_case")]
pub enum WeekOfMonth {
    First,
    Second,
    Third,
    Fourth,
    Last,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DateRelation {
    Before,
    OnOrBefore,
    OnOrAfter,
    After,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AdjustmentDirection {
    Previous,
    Next,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
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

// Task構造体をSvelte側に合わせて修正
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub sub_task_id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: i32,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRule>,
    pub assigned_user_ids: Vec<String>, // アサインされたユーザーIDの配列
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// TaskList構造体を追加
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskList {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Subtask構造体をSvelte側に合わせて修正
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Option<i32>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub is_range_date: Option<bool>,
    pub recurrence_rule: Option<RecurrenceRule>,
    pub assigned_user_ids: Vec<String>, // アサインされたユーザーIDの配列
    pub order_index: i32,
    pub completed: bool, // 既存のcompletedフィールドも保持
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTree {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub owner_id: Option<String>, // プロジェクトオーナーのユーザーID
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub task_lists: Vec<TaskListWithTasks>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskListWithTasks {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tasks: Vec<TaskWithSubTasks>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithSubTasks {
    pub id: String,
    pub sub_task_id: Option<String>, // 追加
    pub list_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus, // StringからTaskStatusに修正
    pub priority: i32,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub is_range_date: Option<bool>, // 追加
    pub recurrence_rule: Option<RecurrenceRule>, // 追加
    pub assigned_user_ids: Vec<String>, // アサインされたユーザーIDの配列
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub sub_tasks: Vec<SubTask>,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTask {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus, // StringからTaskStatusに修正
    pub priority: Option<i32>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub is_range_date: Option<bool>, // 追加
    pub recurrence_rule: Option<RecurrenceRule>, // 追加
    pub assigned_user_ids: Vec<String>, // アサインされたユーザーIDの配列
    pub order_index: i32,
    pub tags: Vec<Tag>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub order_index: Option<i32>, // Svelte側に合わせて追加
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
