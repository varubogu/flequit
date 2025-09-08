//! 検索コマンドモデル

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchCommand {
    pub id: String,
    pub name: String,
    pub query: String,
    pub search_type: String,
    pub created_at: DateTime<Utc>,
}