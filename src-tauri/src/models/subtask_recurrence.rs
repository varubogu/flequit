//! サブタスク繰り返しコマンドモデル

use crate::models::CommandModelConverter;
use chrono::Utc;
use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{RecurrenceRuleId, SubTaskId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtaskRecurrenceCommandModel {
    pub subtask_id: String,
    pub recurrence_rule_id: String,
}

#[async_trait::async_trait]
impl ModelConverter<SubTaskRecurrence> for SubtaskRecurrenceCommandModel {
    async fn to_model(&self) -> Result<SubTaskRecurrence, String> {
        let subtask_id = SubTaskId::from(self.subtask_id.clone());
        let recurrence_rule_id = RecurrenceRuleId::from(self.recurrence_rule_id.clone());

        Ok(SubTaskRecurrence {
            subtask_id,
            recurrence_rule_id,
            created_at: Utc::now(),
        })
    }
}

#[async_trait::async_trait]
impl CommandModelConverter<SubtaskRecurrenceCommandModel> for SubTaskRecurrence {
    async fn to_command_model(&self) -> Result<SubtaskRecurrenceCommandModel, String> {
        Ok(SubtaskRecurrenceCommandModel {
            subtask_id: self.subtask_id.to_string(),
            recurrence_rule_id: self.recurrence_rule_id.to_string(),
        })
    }
}
