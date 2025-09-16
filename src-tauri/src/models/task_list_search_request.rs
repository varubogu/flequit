use serde::{Deserialize, Serialize};

/// タスクリスト検索用のリクエスト構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TaskListSearchRequest {
    pub project_id: Option<String>,
    pub name: Option<String>,
    pub is_archived: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}
