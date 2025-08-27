use crate::types::project_types::ProjectStatus;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::command::ModelConverter;
use crate::models::project::Project;
use crate::types::id_types::{ProjectId, UserId};

/// Tauriコマンド引数用のProject構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectCommand {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub status: Option<ProjectStatus>,
    pub owner_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<Project> for ProjectCommand {
    /// コマンド引数用（ProjectCommand）から内部モデル（Project）に変換
    async fn to_model(&self) -> Result<Project, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(crate::models::project::Project {
            id: ProjectId::from(
                Uuid::parse_str(&self.id).map_err(|e| format!("Invalid project ID: {}", e))?,
            ),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            status: self.status.clone(),
            owner_id: self
                .owner_id
                .as_ref()
                .map(|id| UserId::from(Uuid::parse_str(id).unwrap_or_default())),
            created_at,
            updated_at,
        })
    }
}

/// Tauriコマンド戻り値用のProjectTree構造体（日時フィールドはString、階層構造含む）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTreeCommand {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub status: Option<ProjectStatus>,
    pub owner_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub task_lists: Vec<super::task_list::TaskListTreeCommand>,
}

/// Tauriコマンド引数用のProjectSearchRequest構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectSearchRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<ProjectStatus>,
    pub owner_id: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}
