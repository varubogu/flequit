//! タスク繰り返しコマンドモデル

use crate::models::CommandModelConverter;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{RecurrenceRuleId, TaskId, UserId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRecurrenceCommandModel {
    pub task_id: String,
    pub recurrence_rule_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
}

#[async_trait::async_trait]
impl ModelConverter<TaskRecurrence> for TaskRecurrenceCommandModel {
    async fn to_model(&self) -> Result<TaskRecurrence, String> {
        let task_id = TaskId::from(self.task_id.clone());
        let recurrence_rule_id = RecurrenceRuleId::from(self.recurrence_rule_id.clone());
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(TaskRecurrence {
            task_id,
            recurrence_rule_id,
            created_at,
            updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

#[async_trait::async_trait]
impl CommandModelConverter<TaskRecurrenceCommandModel> for TaskRecurrence {
    async fn to_command_model(&self) -> Result<TaskRecurrenceCommandModel, String> {
        Ok(TaskRecurrenceCommandModel {
            task_id: self.task_id.to_string(),
            recurrence_rule_id: self.recurrence_rule_id.to_string(),
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}
