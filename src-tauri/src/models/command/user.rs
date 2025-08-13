use serde::{Serialize, Deserialize};

use crate::models::user::User;
use crate::models::command::ModelConverter;

/// Tauriコマンド引数用のUser構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserCommand {
    pub id: String,
    pub name: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub avatar: Option<String>,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<User> for UserCommand {
    /// コマンド引数用（UserCommand）から内部モデル（User）に変換
    async fn to_model(&self) -> Result<User, String> {
        use chrono::{DateTime, Utc};

        let created_at = self.created_at.parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self.updated_at.parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(crate::models::user::User {
            id: self.id.clone(),
            name: self.name.clone(),
            email: self.email.clone(),
            avatar_url: self.avatar_url.clone(),
            avatar: self.avatar.clone(),
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            created_at,
            updated_at,
        })
    }
}