//! 日付条件コマンドモデル

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateConditionCommand {
    pub id: String,
    pub name: String,
    pub condition_type: String,
    pub date_value: Option<DateTime<Utc>>,
    pub operator: String,
}