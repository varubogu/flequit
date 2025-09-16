//! 期日ボタンコマンドモデル

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DueDateButtonsCommand {
    pub id: String,
    pub button_configs: Vec<String>,
    pub is_active: bool,
}
