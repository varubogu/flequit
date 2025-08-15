use serde::{Serialize, Deserialize};

use crate::models::{command::ModelConverter, tag::Tag};

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

impl ModelConverter<Tag> for TagCommand {
    /// コマンド引数用（TagCommand）から内部モデル（Tag）に変換
    async fn to_model(&self) -> Result<Tag, String> {
        use chrono::{DateTime, Utc};

        let created_at = self.created_at.parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self.updated_at.parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        use crate::types::id_types::TagId;
        
        Ok(crate::models::tag::Tag {
            id: TagId::from(self.id.clone()),
            name: self.name.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            created_at,
            updated_at,
        })
    }
}

/// Tauriコマンド引数用のTagSearchRequest構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct TagSearchRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub usage_count_min: Option<u32>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub order_by_popularity: Option<bool>,
}
