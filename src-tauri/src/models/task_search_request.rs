use flequit_model::types::task_types::TaskStatus;
use serde::{Deserialize, Serialize};

/// タスク検索用のリクエスト構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskSearchRequest {
    pub project_id: Option<String>,
    pub list_id: Option<String>,
    pub status: Option<TaskStatus>,
    pub assigned_user_id: Option<String>,
    pub tag_id: Option<String>,
    pub title: Option<String>,
    pub is_archived: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}