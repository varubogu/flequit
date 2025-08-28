use async_trait::async_trait;
use flequit_model::types::id_types::TagId;
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::ModelConverter;
use flequit_model::models::tag::Tag;

/// タグ検索用のリクエスト構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagSearchRequest {
    pub name: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

/// Tauriコマンド引数用のTag構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagCommand {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub order_index: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[async_trait]
impl ModelConverter<Tag> for TagCommand {
    /// コマンド引数用（TagCommand）から内部モデル（Tag）に変換
    async fn to_model(&self) -> Result<Tag, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(Tag {
            id: TagId::from(self.id.clone()),
            name: self.name.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            created_at,
            updated_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<TagCommand> for Tag {
    async fn to_command_model(&self) -> Result<TagCommand, String> {
        Ok(TagCommand {
            id: self.id.to_string(),
            name: self.name.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}
