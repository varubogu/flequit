use crate::models::CommandModelConverter;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{TaskId, UserId};
use serde::{Deserialize, Serialize};

/// Tauriコマンド引数用のTaskAssignment構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TaskAssignmentCommandModel {
    pub task_id: String,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
}

#[async_trait]
impl ModelConverter<TaskAssignment> for TaskAssignmentCommandModel {
    /// コマンド引数用（TaskAssignmentCommand）から内部モデル（TaskAssignment）に変換
    async fn to_model(&self) -> Result<TaskAssignment, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(TaskAssignment {
            task_id: TaskId::from(self.task_id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            created_at,
            updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

#[async_trait]
impl CommandModelConverter<TaskAssignmentCommandModel> for TaskAssignment {
    /// ドメインモデル（TaskAssignment）からコマンドモデル（TaskAssignmentCommand）に変換
    async fn to_command_model(&self) -> Result<TaskAssignmentCommandModel, String> {
        Ok(TaskAssignmentCommandModel {
            task_id: self.task_id.to_string(),
            user_id: self.user_id.to_string(),
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}
