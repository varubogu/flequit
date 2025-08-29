use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use flequit_model::models::{assignment::{TaskAssignment, SubtaskAssignment}, ModelConverter};
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::{TaskId, SubTaskId, UserId};

/// Tauriコマンド引数用のTaskAssignment構造体（created_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskAssignmentCommand {
    pub task_id: String,
    pub user_id: String,
    pub created_at: String,
}

#[async_trait]
impl ModelConverter<TaskAssignment> for TaskAssignmentCommand {
    /// コマンド引数用（TaskAssignmentCommand）から内部モデル（TaskAssignment）に変換
    async fn to_model(&self) -> Result<TaskAssignment, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        Ok(TaskAssignment {
            task_id: TaskId::from(self.task_id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            created_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<TaskAssignmentCommand> for TaskAssignment {
    /// ドメインモデル（TaskAssignment）からコマンドモデル（TaskAssignmentCommand）に変換
    async fn to_command_model(&self) -> Result<TaskAssignmentCommand, String> {
        Ok(TaskAssignmentCommand {
            task_id: self.task_id.to_string(),
            user_id: self.user_id.to_string(),
            created_at: self.created_at.to_rfc3339(),
        })
    }
}

/// Tauriコマンド引数用のSubtaskAssignment構造体（created_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtaskAssignmentCommand {
    pub subtask_id: String,
    pub user_id: String,
    pub created_at: String,
}

#[async_trait]
impl ModelConverter<SubtaskAssignment> for SubtaskAssignmentCommand {
    /// コマンド引数用（SubtaskAssignmentCommand）から内部モデル（SubtaskAssignment）に変換
    async fn to_model(&self) -> Result<SubtaskAssignment, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        Ok(SubtaskAssignment {
            subtask_id: SubTaskId::from(self.subtask_id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            created_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<SubtaskAssignmentCommand> for SubtaskAssignment {
    /// ドメインモデル（SubtaskAssignment）からコマンドモデル（SubtaskAssignmentCommand）に変換
    async fn to_command_model(&self) -> Result<SubtaskAssignmentCommand, String> {
        Ok(SubtaskAssignmentCommand {
            subtask_id: self.subtask_id.to_string(),
            user_id: self.user_id.to_string(),
            created_at: self.created_at.to_rfc3339(),
        })
    }
}