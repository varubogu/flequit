//! 初期化データコマンドモデル

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializedDataCommand {
    pub id: String,
    pub data_type: String,
    pub data_content: String,
    pub created_at: DateTime<Utc>,
}