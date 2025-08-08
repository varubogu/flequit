use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub avatar_url: Option<String>, // avatar_urlフィールド（診断エラー対応用に追加フィールドも）
    pub avatar: Option<String>, // Svelte側のavatarフィールドに対応
    pub username: Option<String>, // 診断エラーで必要とされているフィールド
    pub display_name: Option<String>, // 診断エラーで必要とされているフィールド
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub order_index: Option<i32>, // Svelte側に合わせて追加
    pub created_at: i64,
    pub updated_at: i64,
}