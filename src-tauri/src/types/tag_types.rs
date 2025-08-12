use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub order_index: Option<i32>, // Svelte側に合わせて追加
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}