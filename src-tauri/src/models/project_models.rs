use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::super::types::{project_types::{ProjectStatus, MemberRole}};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>, // Svelte側に合わせて追加
    pub order_index: i32, // Svelte側に合わせて追加
    pub is_archived: bool, // Svelte側に合わせて追加
    pub status: Option<ProjectStatus>, // Optionalに変更（Svelte側にはないが既存機能保持）
    pub owner_id: Option<String>, // プロジェクトオーナーのユーザーID
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMember {
    pub user_id: String,
    pub project_id: String,
    pub role: MemberRole,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTree {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub owner_id: Option<String>, // プロジェクトオーナーのユーザーID
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub task_lists: Vec<super::task_list_models::TaskListWithTasks>,
}