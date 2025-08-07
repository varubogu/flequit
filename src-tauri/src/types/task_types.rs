use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Priority,
    pub assigned_to: Option<String>,
    pub tags: Vec<String>,
    pub due_date: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskStatus {
    Todo,
    InProgress,
    Review,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub completed: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTree {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
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
    pub created_at: i64,
    pub updated_at: i64,
    pub tasks: Vec<TaskWithSubTasks>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithSubTasks {
    pub id: String,
    pub list_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: i32,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub sub_tasks: Vec<SubTask>,
    pub tags: Vec<crate::types::user_types::Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTask {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: Option<i32>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub order_index: i32,
    pub tags: Vec<crate::types::user_types::Tag>,
    pub created_at: i64,
    pub updated_at: i64,
}
