use crate::models::account::Account;
use crate::models::command::project::ProjectTreeCommand;
use crate::models::setting::Settings;
use serde::{Deserialize, Serialize};

/// Tauriコマンド戻り値用の初期化結果構造体（日時フィールドはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializedResult {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<ProjectTreeCommand>,
}

