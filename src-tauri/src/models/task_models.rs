use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::super::types::task_types::TaskStatus;
use super::datetime_calendar_models::RecurrenceRule;
use super::tag_models::Tag;

// Task構造体をSvelte側に合わせて修正
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub sub_task_id: Option<String>,
    pub project_id: String,
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
    pub tag_ids: Vec<String>, // 付与されたタグIDの配列
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithSubTasks {
    pub id: String,
    pub sub_task_id: Option<String>, // 追加
    pub project_id: String,
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
    pub sub_tasks: Vec<super::sub_task_models::SubTask>,
    pub tags: Vec<Tag>,
}