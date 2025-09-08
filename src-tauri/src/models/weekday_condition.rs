//! 曜日条件コマンドモデル

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekdayConditionCommand {
    pub id: String,
    pub name: String,
    pub weekday_pattern: String,
    pub is_active: bool,
}