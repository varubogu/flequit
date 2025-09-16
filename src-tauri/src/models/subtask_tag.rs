use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{SubTaskId, TagId};

/// Tauriコマンド引数用のSubtaskTag構造体（created_atはString）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtaskTagCommandModel {
    pub subtask_id: String,
    pub tag_id: String,
    pub created_at: String,
}

#[async_trait]
impl ModelConverter<SubTaskTag> for SubtaskTagCommandModel {
    /// コマンド引数用（SubtaskTagCommand）から内部モデル（SubtaskTag）に変換
    async fn to_model(&self) -> Result<SubTaskTag, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        Ok(SubTaskTag {
            subtask_id: SubTaskId::from(self.subtask_id.clone()),
            tag_id: TagId::from(self.tag_id.clone()),
            created_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<SubtaskTagCommandModel> for SubTaskTag {
    /// ドメインモデル（SubtaskTag）からコマンドモデル（SubtaskTagCommand）に変換
    async fn to_command_model(&self) -> Result<SubtaskTagCommandModel, String> {
        Ok(SubtaskTagCommandModel {
            subtask_id: self.subtask_id.to_string(),
            tag_id: self.tag_id.to_string(),
            created_at: self.created_at.to_rfc3339(),
        })
    }
}
