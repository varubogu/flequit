use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::{
    task_types::TaskWithSubTasks
};

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