use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub avatar_url: Option<String>, // avatar_urlフィールド（診断エラー対応用に追加フィールドも）
    pub avatar: Option<String>, // Svelte側のavatarフィールドに対応
    pub username: Option<String>, // 診断エラーで必要とされているフィールド
    pub display_name: Option<String>, // 診断エラーで必要とされているフィールド
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

