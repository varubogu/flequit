use async_trait::async_trait;
use flequit_model::types::id_types::{TagId, UserId};
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::models::ModelConverter;

/// Tauriコマンド引数用のTag構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TagCommandModel {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub order_index: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
}

#[async_trait]
impl ModelConverter<Tag> for TagCommandModel {
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
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

#[async_trait]
impl CommandModelConverter<TagCommandModel> for Tag {
    async fn to_command_model(&self) -> Result<TagCommandModel, String> {
        Ok(TagCommandModel {
            id: self.id.to_string(),
            name: self.name.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}
