use serde::{Serialize, Deserialize};
use super::super::types::{project_types::ProjectStatus, task_types::TaskStatus};

// Project command types
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectSearchRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<ProjectStatus>,
    pub owner_id: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

// Task command types
#[derive(Debug, Serialize, Deserialize)]
pub struct TaskSearchRequest {
    pub project_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub assignee_id: Option<String>,
    pub priority_min: Option<i32>,
    pub priority_max: Option<i32>,
    pub tag_ids: Option<Vec<String>>,
    pub due_date_from: Option<String>,
    pub due_date_to: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

// Subtask command types
#[derive(Debug, Serialize, Deserialize)]
pub struct SubtaskSearchRequest {
    pub project_id: String,
    pub task_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub completed: Option<bool>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

// Tag command types
#[derive(Debug, Serialize, Deserialize)]
pub struct TagSearchRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub usage_count_min: Option<u32>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub order_by_popularity: Option<bool>,
}

// Task list command types
#[derive(Debug, Serialize, Deserialize)]
pub struct TaskListSearchRequest {
    pub project_id: Option<String>,
    pub name: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}