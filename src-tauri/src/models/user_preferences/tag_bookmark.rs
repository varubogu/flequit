use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// TagBookmarkコマンドモデル
/// Tauriコマンドのパラメータと戻り値に使用
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagBookmarkCommandModel {
    pub id: String,
    pub user_id: String,
    pub project_id: String,
    pub tag_id: String,
    pub order_index: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// TagBookmark作成用の入力モデル
#[derive(Debug, Clone, Deserialize)]
pub struct CreateTagBookmarkInput {
    pub project_id: String,
    pub tag_id: String,
}

/// TagBookmark更新用の入力モデル
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateTagBookmarkInput {
    pub id: String,
    pub order_index: Option<i32>,
}
