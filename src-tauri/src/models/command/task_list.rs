use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::models::command::ModelConverter;
use crate::models::task_list::TaskList;
use crate::types::id_types::TaskListId;

/// Tauriコマンド引数用のTaskList構造体（created_at/updated_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskListCommand {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<TaskList> for TaskListCommand {
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

        Ok(crate::models::task_list::TaskList {
            id: TaskListId::from(self.id.clone()),
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

/// Tauriコマンド戻り値用のTaskListTree構造体（日時フィールドはString、階層構造含む）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskListTreeCommand {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub order_index: i32,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub tasks: Vec<super::task::TaskTreeCommand>,
}

/// Tauriコマンド引数用のTaskListSearchRequest構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct TaskListSearchRequest {
    pub project_id: Option<String>,
    pub name: Option<String>,
    pub created_from: Option<String>,
    pub created_to: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}
