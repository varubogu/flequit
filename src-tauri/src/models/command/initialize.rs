use serde::{Deserialize, Serialize};
use crate::models::account::Account;
use crate::models::command::ModelConverter;
use crate::models::initialized_data::InitializedData;
use crate::models::project::Project;
use crate::models::setting::Settings;

/// Tauriコマンド引数用のAccount構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializedResult {
    pub settings: Settings,
    pub accounts: Vec<Account>,
    pub projects: Vec<Project>
}

impl ModelConverter<InitializedData> for InitializedResult {
    /// コマンド引数用（AccountCommand）から内部モデル（Account）に変換
    async fn to_model(&self) -> Result<InitializedData, String> {
        Ok(InitializedData {
            settings: self.settings.clone(),
            accounts: self.accounts.clone(),
            projects: self.projects.clone(),
        })
    }
}
