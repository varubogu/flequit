use flequit_model::types::task_types::TaskStatus;
use serde::{Deserialize, Serialize};

/// サブタスク検索用のリクエスト構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubTaskSearchRequest {
    pub task_id: Option<String>,
    pub title: Option<String>,
    pub status: Option<TaskStatus>,
    pub priority: Option<i32>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}
