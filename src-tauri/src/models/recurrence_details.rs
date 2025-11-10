//! 繰り返し詳細コマンドモデル

use crate::models::CommandModelConverter;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::recurrence_details::RecurrenceDetails;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::UserId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecurrenceDetailsCommandModel {
    pub specific_date: Option<i32>,
    pub week_of_period: Option<String>,
    pub weekday_of_week: Option<String>,
    pub date_conditions: Option<Vec<String>>, // 簡略化
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
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

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(RecurrenceDetails {
            specific_date: self.specific_date,
            week_of_period,
            weekday_of_week,
            date_conditions: None, // 簡略化
            created_at,
            updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
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
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}

/// Tauri コマンド引数用の PartialRecurrenceDetails 構造体（部分更新用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PartialRecurrenceDetailsCommandModel {
    pub specific_date: Option<Option<i32>>,
    pub week_of_period: Option<Option<String>>,
    pub weekday_of_week: Option<Option<String>>,
    pub date_conditions: Option<Option<Vec<String>>>,
}
