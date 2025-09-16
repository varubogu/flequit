//! ユーザーコマンドモデル

use crate::models::CommandModelConverter;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::users::user::{User, PartialUser};
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::UserId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCommandModel {
    pub id: String,
    pub handle_id: String,
    pub display_name: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub timezone: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[async_trait]
impl ModelConverter<User> for UserCommandModel {
    /// コマンド引数用（UserCommandModel）から内部モデル（User）に変換
    async fn to_model(&self) -> Result<User, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(User {
            id: UserId::from(self.id.clone()),
            handle_id: self.handle_id.clone(),
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

#[async_trait]
impl CommandModelConverter<UserCommandModel> for User {
    /// ドメインモデル（User）からコマンドモデル（UserCommandModel）に変換
    async fn to_command_model(&self) -> Result<UserCommandModel, String> {
        Ok(UserCommandModel {
            id: self.id.to_string(),
            handle_id: self.handle_id.clone(),
            display_name: self.display_name.clone(),
            email: self.email.clone(),
            avatar_url: self.avatar_url.clone(),
            bio: self.bio.clone(),
            timezone: self.timezone.clone(),
            is_active: self.is_active,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}

/// Tauri コマンド引数用の PartialUser 構造体（部分更新用）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartialUserCommandModel {
    pub handle_id: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<Option<String>>,
    pub avatar_url: Option<Option<String>>,
    pub bio: Option<Option<String>>,
    pub timezone: Option<Option<String>>,
    pub is_active: Option<bool>,
}

#[async_trait]
impl ModelConverter<PartialUser> for PartialUserCommandModel {
    /// コマンド引数用（PartialUserCommandModel）から内部モデル（PartialUser）に変換
    async fn to_model(&self) -> Result<PartialUser, String> {
        Ok(PartialUser {
            handle_id: self.handle_id.clone(),
            display_name: self.display_name.clone(),
            email: self.email.clone(),
            avatar_url: self.avatar_url.clone(),
            bio: self.bio.clone(),
            timezone: self.timezone.clone(),
            is_active: self.is_active,
            ..Default::default()
        })
    }
}

#[async_trait]
impl CommandModelConverter<PartialUserCommandModel> for PartialUser {
    /// 内部モデル（PartialUser）からコマンド引数用（PartialUserCommandModel）に変換
    async fn to_command_model(&self) -> Result<PartialUserCommandModel, String> {
        Ok(PartialUserCommandModel {
            handle_id: self.handle_id.clone(),
            display_name: self.display_name.clone(),
            email: self.email.clone(),
            avatar_url: self.avatar_url.clone(),
            bio: self.bio.clone(),
            timezone: self.timezone.clone(),
            is_active: self.is_active,
        })
    }
}
