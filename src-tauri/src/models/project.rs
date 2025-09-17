use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::ModelConverter;
use flequit_model::types::project_types::ProjectStatus;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::CommandModelConverter;
use flequit_model::models::task_projects::project::{Project, ProjectTree};
use flequit_model::types::id_types::{ProjectId, UserId};

/// Tauriコマンド引数用のProject構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectCommandModel {
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
impl ModelConverter<Project> for ProjectCommandModel {
    /// コマンド引数用（ProjectCommand）から内部モデル（Project）に変換
    async fn to_model(&self) -> Result<Project, String> {
        use chrono::{DateTime, Utc};

        let project_id = ProjectId::from(
            Uuid::parse_str(&self.id).map_err(|e| format!("Invalid project ID: {}", e))?,
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
impl CommandModelConverter<ProjectCommandModel> for Project {
    /// ドメインモデル（Project）からコマンドモデル（ProjectCommandModel）に変換
    async fn to_command_model(&self) -> Result<ProjectCommandModel, String> {
        Ok(ProjectCommandModel {
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
#[serde(rename_all = "camelCase")]
pub struct ProjectTreeCommandModel {
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
    pub task_lists: Vec<super::task_list::TaskListTreeCommandModel>,
    pub all_tags: Vec<super::tag::TagCommandModel>,
}

#[async_trait]
impl ModelConverter<ProjectTree> for ProjectTreeCommandModel {
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

        let mut tag_commands = Vec::new();
        for tag in &self.all_tags {
            tag_commands.push(tag.to_model().await?);
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
impl CommandModelConverter<ProjectTreeCommandModel> for ProjectTree {
    /// ドメインモデル（ProjectTree）からコマンドモデル（ProjectTreeCommandModel）に変換
    async fn to_command_model(&self) -> Result<ProjectTreeCommandModel, String> {
        Ok(ProjectTreeCommandModel {
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
            all_tags: Vec::new(), // ProjectTreeにはall_tagsフィールドがないため空のVecを返す
        })
    }
}
