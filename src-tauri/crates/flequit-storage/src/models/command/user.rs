use serde::{Deserialize, Serialize};

use crate::models::command::ModelConverter;
use crate::models::user::User;

/// Tauriコマンド引数用のUser構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserCommand {
    pub id: String,
    pub username: String,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub timezone: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<User> for UserCommand {
    /// コマンド引数用（UserCommand）から内部モデル（User）に変換
    async fn to_model(&self) -> Result<User, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        use crate::types::id_types::UserId;

        Ok(crate::models::user::User {
            id: UserId::from(self.id.clone()),
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            email: self.email.clone(),
            avatar_url: self.avatar_url.clone(),
            bio: self.bio.clone(),
            timezone: self.timezone.clone(),
            is_active: self.is_active,
            created_at,
            updated_at,
        })
    }
}
