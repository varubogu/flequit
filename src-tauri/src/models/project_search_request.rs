use flequit_model::types::project_types::ProjectStatus;
use serde::{Deserialize, Serialize};

/// プロジェクト検索用のリクエスト構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSearchRequest {
    pub name: Option<String>,
    pub status: Option<ProjectStatus>,
    pub owner_id: Option<String>,
    pub is_archived: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}
