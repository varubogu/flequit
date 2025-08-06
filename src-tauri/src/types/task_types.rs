use serde::{Deserialize, Serialize};
use crate::impl_automerge_serializable;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
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
    pub tags: Vec<Tag>,
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
    pub tags: Vec<Tag>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

// AutomergeSerializableの実装
impl_automerge_serializable!(Tag, "1.0", {
    required id: String,
    required name: String,
    required created_at: i64,
    required updated_at: i64,
    optional color: Option<String> = None,
});

impl_automerge_serializable!(SubTask, "1.0", {
    required id: String,
    required task_id: String,
    required title: String,
    required status: String,
    required order_index: i32,
    required created_at: i64,
    required updated_at: i64,
    optional description: Option<String> = None,
    optional priority: Option<i32> = Some(0),
    optional start_date: Option<i64> = None,
    optional end_date: Option<i64> = None,
});

impl_automerge_serializable!(TaskWithSubTasks, "1.0", {
    required id: String,
    required list_id: String,
    required title: String,
    required status: String,
    required priority: i32,
    required order_index: i32,
    required is_archived: bool,
    required created_at: i64,
    required updated_at: i64,
    optional description: Option<String> = None,
    optional start_date: Option<i64> = None,
    optional end_date: Option<i64> = None,
});

impl_automerge_serializable!(TaskListWithTasks, "1.0", {
    required id: String,
    required project_id: String,
    required name: String,
    required order_index: i32,
    required is_archived: bool,
    required created_at: i64,
    required updated_at: i64,
    optional description: Option<String> = None,
    optional color: Option<String> = None,
});

impl_automerge_serializable!(ProjectTree, "1.0", {
    required id: String,
    required name: String,
    required order_index: i32,
    required is_archived: bool,
    required created_at: i64,
    required updated_at: i64,
    optional description: Option<String> = None,
    optional color: Option<String> = None,
});

impl_automerge_serializable!(Task, "1.0", {
    required id: String,
    required title: String,
    required description: String,
    required completed: bool,
    required created_at: i64,
    required updated_at: i64,
});