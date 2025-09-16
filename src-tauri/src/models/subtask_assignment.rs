use crate::models::CommandModelConverter;
use async_trait::async_trait;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{SubTaskId, UserId};
use serde::{Deserialize, Serialize};

/// Tauriコマンド引数用のSubtaskAssignment構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SubtaskAssignmentCommandModel {
    pub subtask_id: String,
    pub user_id: String,
    pub created_at: String,
}

#[async_trait]
impl ModelConverter<SubTaskAssignment> for SubtaskAssignmentCommandModel {
    /// コマンド引数用（SubtaskAssignmentCommand）から内部モデル（SubtaskAssignment）に変換
    async fn to_model(&self) -> Result<SubTaskAssignment, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        Ok(SubTaskAssignment {
            subtask_id: SubTaskId::from(self.subtask_id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            created_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<SubtaskAssignmentCommandModel> for SubTaskAssignment {
    /// ドメインモデル（SubtaskAssignment）からコマンドモデル（SubtaskAssignmentCommand）に変換
    async fn to_command_model(&self) -> Result<SubtaskAssignmentCommandModel, String> {
        Ok(SubtaskAssignmentCommandModel {
            subtask_id: self.subtask_id.to_string(),
            user_id: self.user_id.to_string(),
            created_at: self.created_at.to_rfc3339(),
        })
    }
}
