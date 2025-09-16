//! 繰り返し調整コマンドモデル

use crate::models::CommandModelConverter;
use flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment;
use flequit_model::models::ModelConverter;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurrenceAdjustmentCommandModel {
    pub date_conditions: Vec<String>,    // 簡略化
    pub weekday_conditions: Vec<String>, // 簡略化
}

#[async_trait::async_trait]
impl ModelConverter<RecurrenceAdjustment> for RecurrenceAdjustmentCommandModel {
    async fn to_model(&self) -> Result<RecurrenceAdjustment, String> {
        // 簡略化: 空のベクターで初期化
        Ok(RecurrenceAdjustment {
            date_conditions: Vec::new(),
            weekday_conditions: Vec::new(),
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
            date_conditions,
            weekday_conditions,
        })
    }
}
