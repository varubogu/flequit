//! タスク繰り返しコマンドモデル

use serde::{Deserialize, Serialize};
use chrono::Utc;
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::types::id_types::{TaskId, RecurrenceRuleId};
use flequit_model::models::ModelConverter;
use crate::models::CommandModelConverter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskRecurrenceCommandModel {
    pub task_id: String,
    pub recurrence_rule_id: String,
}

#[async_trait::async_trait]
impl ModelConverter<TaskRecurrence> for TaskRecurrenceCommandModel {
    async fn to_model(&self) -> Result<TaskRecurrence, String> {
        let task_id = TaskId::from(self.task_id.clone());
        let recurrence_rule_id = RecurrenceRuleId::from(self.recurrence_rule_id.clone());

        Ok(TaskRecurrence {
            task_id,
            recurrence_rule_id,
            created_at: Utc::now(),
        })
    }
}

#[async_trait::async_trait]
impl CommandModelConverter<TaskRecurrenceCommandModel> for TaskRecurrence {
    async fn to_command_model(&self) -> Result<TaskRecurrenceCommandModel, String> {
        Ok(TaskRecurrenceCommandModel {
            task_id: self.task_id.to_string(),
            recurrence_rule_id: self.recurrence_rule_id.to_string(),
        })
    }
}
