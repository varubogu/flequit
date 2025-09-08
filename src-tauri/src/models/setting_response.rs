//! 設定レスポンスコマンドモデル

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingResponseCommand {
    pub id: String,
    pub setting_key: String,
    pub response_value: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}