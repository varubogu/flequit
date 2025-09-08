use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::models::ModelConverter;
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::{TaskId, TagId};

/// Tauriコマンド引数用のTaskTag構造体（created_atはString）
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct TaskTagCommandModel {
    pub task_id: String,
    pub tag_id: String,
    pub created_at: String,
}

#[async_trait]
impl ModelConverter<TaskTag> for TaskTagCommandModel {
    /// コマンド引数用（TaskTagCommand）から内部モデル（TaskTag）に変換
    async fn to_model(&self) -> Result<TaskTag, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;

        Ok(TaskTag {
            task_id: TaskId::from(self.task_id.clone()),
            tag_id: TagId::from(self.tag_id.clone()),
            created_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<TaskTagCommandModel> for TaskTag {
    /// ドメインモデル（TaskTag）からコマンドモデル（TaskTagCommand）に変換
    async fn to_command_model(&self) -> Result<TaskTagCommandModel, String> {
        Ok(TaskTagCommandModel {
            task_id: self.task_id.to_string(),
            tag_id: self.tag_id.to_string(),
            created_at: self.created_at.to_rfc3339(),
        })
    }
}
