use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::types::project_types::ProjectStatus;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use flequit_model::models::ModelConverter;

use crate::models::{CommandModelConverter};
use flequit_model::models::project::{Project, ProjectTree};
use flequit_model::types::id_types::{ProjectId, UserId};

/// プロジェクト検索用のリクエスト構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSearchRequest {
    pub name: Option<String>,
    pub status: Option<ProjectStatus>,
    pub owner_id: Option<String>,
    pub is_archived: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

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

#[async_trait]
impl ModelConverter<Project> for ProjectCommand {
    /// コマンド引数用（ProjectCommand）から内部モデル（Project）に変換
    async fn to_model(&self) -> Result<Project, String> {
        use chrono::{DateTime, Utc};

        let project_id =ProjectId::from(
                Uuid::parse_str(&self.id)
                .map_err(|e| format!("Invalid project ID: {}", e))?,
        );
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(Project {
            id: project_id,
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

#[async_trait]
impl CommandModelConverter<ProjectCommand> for Project {
    /// ドメインモデル（Account）からコマンドモデル（AccountCommand）に変換
    async fn to_command_model(&self) -> Result<ProjectCommand, String> {
        Ok(ProjectCommand {
            id: self.id.to_string(),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            status: self.status.clone(),
            owner_id: Option::from(self.owner_id.unwrap_or_default().to_string()),
            created_at: self.created_at.to_string(),
            updated_at: self.updated_at.to_string(),
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

#[async_trait]
impl ModelConverter<ProjectTree> for ProjectTreeCommand {
    /// ドメインモデル（ProjectTree）からコマンドモデル（ProjectTreeCommand）に変換
    async fn to_model(&self) -> Result<ProjectTree, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        let mut task_list_commands = Vec::new();
        for task_list in &self.task_lists {
            task_list_commands.push(task_list.to_model().await?);
        }

        Ok(ProjectTree {
            id: ProjectId::from(self.id.clone()),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            status: self.status.clone(),
            owner_id: Option::from(UserId::from(self.owner_id.clone().unwrap_or_default())),
            created_at,
            updated_at,
            task_lists: task_list_commands,
        })
    }
}

#[async_trait]
impl CommandModelConverter<ProjectTreeCommand> for ProjectTree {
    /// ドメインモデル（Account）からコマンドモデル（AccountCommand）に変換
    async fn to_command_model(&self) -> Result<ProjectTreeCommand, String> {
        Ok(ProjectTreeCommand {
            id: self.id.to_string(),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            status: self.status.clone(),
            owner_id: self.owner_id.as_ref().map(|id| id.to_string()),
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            task_lists: {
                let mut task_list_commands = Vec::new();
                for task_list in &self.task_lists {
                    task_list_commands.push(task_list.to_command_model().await?);
                }
                task_list_commands
            },
        })
    }
}
