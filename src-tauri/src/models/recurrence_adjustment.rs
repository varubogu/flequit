//! 繰り返し調整コマンドモデル

use crate::models::CommandModelConverter;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{RecurrenceAdjustmentId, RecurrenceRuleId, UserId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurrenceAdjustmentCommandModel {
    pub id: String,
    pub recurrence_rule_id: String,
    pub date_conditions: Vec<String>,    // 簡略化
    pub weekday_conditions: Vec<String>, // 簡略化
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
}

#[async_trait::async_trait]
impl ModelConverter<RecurrenceAdjustment> for RecurrenceAdjustmentCommandModel {
    async fn to_model(&self) -> Result<RecurrenceAdjustment, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        // 簡略化: 空のベクターで初期化
        Ok(RecurrenceAdjustment {
            id: RecurrenceAdjustmentId::from(self.id.clone()),
            recurrence_rule_id: RecurrenceRuleId::from(self.recurrence_rule_id.clone()),
            date_conditions: Vec::new(),
            weekday_conditions: Vec::new(),
            created_at,
            updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

#[async_trait::async_trait]
impl CommandModelConverter<RecurrenceAdjustmentCommandModel> for RecurrenceAdjustment {
    async fn to_command_model(&self) -> Result<RecurrenceAdjustmentCommandModel, String> {
        // 簡略化: 文字列表現で返す
        let date_conditions = self
            .date_conditions
            .iter()
            .map(|d| format!("{:?}", d))
            .collect();
        let weekday_conditions = self
            .weekday_conditions
            .iter()
            .map(|w| format!("{:?}", w))
            .collect();

        Ok(RecurrenceAdjustmentCommandModel {
            id: self.id.to_string(),
            recurrence_rule_id: self.recurrence_rule_id.to_string(),
            date_conditions,
            weekday_conditions,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}
