use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::models::task::TaskTreeCommandModel;
use crate::models::CommandModelConverter;
use flequit_model::models::task_projects::task_list::{TaskList, TaskListTree};
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{ProjectId, TaskListId};

/// Tauriコマンド引数用のTaskList構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskListCommandModel {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[async_trait]
impl ModelConverter<TaskList> for TaskListCommandModel {
    /// コマンド引数用（TaskListCommand）から内部モデル（TaskList）に変換
    async fn to_model(&self) -> Result<TaskList, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(TaskList {
            id: TaskListId::from(self.id.clone()),
            project_id: ProjectId::from(self.project_id.clone()),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at,
            updated_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<TaskListCommandModel> for TaskList {
    async fn to_command_model(&self) -> Result<TaskListCommandModel, String> {
        Ok(TaskListCommandModel {
            id: self.id.to_string(),
            project_id: self.project_id.to_string(),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}

/// Tauriコマンド戻り値用のTaskListTree構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskListTreeCommandModel {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub tasks: Vec<TaskTreeCommandModel>,
}

#[async_trait]
impl ModelConverter<TaskListTree> for TaskListTreeCommandModel {
    /// コマンド引数用（TaskListTreeCommand）から内部モデル（TaskListTree）に変換
    async fn to_model(&self) -> Result<TaskListTree, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        let mut tasks = Vec::new();
        for task in &self.tasks {
            tasks.push(task.to_model().await?);
        }

        Ok(TaskListTree {
            id: TaskListId::from(self.id.clone()),
            project_id: ProjectId::from(self.project_id.clone()),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at,
            updated_at,
            tasks,
        })
    }
}

#[async_trait]
impl CommandModelConverter<TaskListTreeCommandModel> for TaskListTree {
    async fn to_command_model(&self) -> Result<TaskListTreeCommandModel, String> {
        let mut task_commands = Vec::new();
        for task in &self.tasks {
            task_commands.push(task.to_command_model().await?);
        }

        Ok(TaskListTreeCommandModel {
            id: self.id.to_string(),
            project_id: self.project_id.to_string(),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            tasks: task_commands,
        })
    }
}
