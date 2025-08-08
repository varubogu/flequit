use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>, // Svelte側に合わせて追加
    pub order_index: i32, // Svelte側に合わせて追加
    pub is_archived: bool, // Svelte側に合わせて追加
    pub status: Option<ProjectStatus>, // Optionalに変更（Svelte側にはないが既存機能保持）
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectStatus {
    Planning,
    Active,
    OnHold,
    Completed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMember {
    pub user_id: String,
    pub project_id: String,
    pub role: MemberRole,
    pub joined_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemberRole {
    Owner,
    Admin,
    Member,
    Viewer,
}