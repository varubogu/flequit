//! 検索コマンドモデル

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchCommand {
    pub id: String,
    pub name: String,
    pub query: String,
    pub search_type: String,
    pub created_at: DateTime<Utc>,
}
