use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::{
    datetime_calendar_types::RecurrenceRule,
    tag_types::Tag
};

// TaskStatusを再エクスポート
pub use super::task_types::TaskStatus;

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
    pub tag_ids: Vec<String>, // 付与されたタグIDの配列
    pub order_index: i32,
    pub completed: bool, // 既存のcompletedフィールドも保持
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
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