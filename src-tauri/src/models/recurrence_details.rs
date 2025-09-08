//! 繰り返し詳細コマンドモデル

use serde::{Deserialize, Serialize};
use flequit_model::models::task_projects::recurrence_details::RecurrenceDetails;
use flequit_model::models::ModelConverter;
use crate::models::CommandModelConverter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceDetailsCommandModel {
    pub specific_date: Option<i32>,
    pub week_of_period: Option<String>,
    pub weekday_of_week: Option<String>,
    pub date_conditions: Option<Vec<String>>, // 簡略化
}

#[async_trait::async_trait]
impl ModelConverter<RecurrenceDetails> for RecurrenceDetailsCommandModel {
    async fn to_model(&self) -> Result<RecurrenceDetails, String> {
        let week_of_period = if let Some(ref _week) = self.week_of_period {
            // WeekOfMonth enumの適切な変換が必要（実装詳細は省略）
            None
        } else {
            None
        };

        let weekday_of_week = if let Some(ref _day) = self.weekday_of_week {
            // DayOfWeek enumの適切な変換が必要（実装詳細は省略）
            None
        } else {
            None
        };

        Ok(RecurrenceDetails {
            specific_date: self.specific_date,
            week_of_period,
            weekday_of_week,
            date_conditions: None, // 簡略化
        })
    }
}

#[async_trait::async_trait]
impl CommandModelConverter<RecurrenceDetailsCommandModel> for RecurrenceDetails {
    async fn to_command_model(&self) -> Result<RecurrenceDetailsCommandModel, String> {
        let week_of_period = self.week_of_period.as_ref().map(|w| format!("{:?}", w));
        let weekday_of_week = self.weekday_of_week.as_ref().map(|d| format!("{:?}", d));

        Ok(RecurrenceDetailsCommandModel {
            specific_date: self.specific_date,
            week_of_period,
            weekday_of_week,
            date_conditions: None, // 簡略化
        })
    }
}
