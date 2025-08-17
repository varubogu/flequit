use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::account::Account;
use crate::models::command::ModelConverter;
use crate::types::id_types::AccountId;

/// Tauriコマンド引数用のAccount構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountCommand {
    pub id: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub provider: String,
    pub provider_id: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<Account> for AccountCommand {
    /// コマンド引数用（AccountCommand）から内部モデル（Account）に変換
    async fn to_model(&self) -> Result<Account, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(crate::models::account::Account {
            id: AccountId::from(
                Uuid::parse_str(&self.id).map_err(|e| format!("Invalid account ID: {}", e))?,
            ),
            email: self.email.clone(),
            display_name: self.display_name.clone(),
            avatar_url: self.avatar_url.clone(),
            provider: self.provider.clone(),
            provider_id: self.provider_id.clone(),
            is_active: self.is_active,
            created_at,
            updated_at,
        })
    }
}
