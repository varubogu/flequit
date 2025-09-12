use serde::{Deserialize, Serialize};

/// タグ検索用のリクエスト構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct TagSearchRequest {
    pub name: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}
