//! 初期化データコマンドモデル

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializedDataCommand {
    pub id: String,
    pub data_type: String,
    pub data_content: String,
    pub created_at: DateTime<Utc>,
}
