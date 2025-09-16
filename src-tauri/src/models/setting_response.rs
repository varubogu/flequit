//! 設定レスポンスコマンドモデル

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingResponseCommand {
    pub id: String,
    pub setting_key: String,
    pub response_value: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}
