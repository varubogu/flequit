//! 曜日条件コマンドモデル

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::{task_projects::weekday_condition::WeekdayCondition, ModelConverter},
    types::{
        datetime_calendar_types::{AdjustmentDirection, AdjustmentTarget, DayOfWeek},
        id_types::{UserId, WeekdayConditionId},
    },
};
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekdayConditionCommandModel {
    pub id: String,
    pub if_weekday: DayOfWeek,
    pub then_direction: AdjustmentDirection,
    pub then_target: AdjustmentTarget,
    pub then_weekday: Option<DayOfWeek>,
    pub then_days: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted: bool,
    pub updated_by: String,
}

#[async_trait]
impl ModelConverter<WeekdayCondition> for WeekdayConditionCommandModel {
    /// コマンド引数用（WeekdayConditionCommand）から内部モデル（WeekdayCondition）に変換
    async fn to_model(&self) -> Result<WeekdayCondition, String> {
        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(WeekdayCondition {
            id: WeekdayConditionId::from(self.id.clone()),
            if_weekday: self.if_weekday.clone(),
            then_direction: self.then_direction.clone(),
            then_target: self.then_target.clone(),
            then_weekday: self.then_weekday.clone(),
            then_days: self.then_days,
            created_at,
            updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

#[async_trait]
impl CommandModelConverter<WeekdayConditionCommandModel> for WeekdayCondition {
    /// ドメインモデル（WeekdayCondition）からコマンドモデル（WeekdayConditionCommand）に変換
    async fn to_command_model(&self) -> Result<WeekdayConditionCommandModel, String> {
        Ok(WeekdayConditionCommandModel {
            id: self.id.to_string(),
            if_weekday: self.if_weekday.clone(),
            then_direction: self.then_direction.clone(),
            then_target: self.then_target.clone(),
            then_weekday: self.then_weekday.clone(),
            then_days: self.then_days,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
            deleted: self.deleted,
            updated_by: self.updated_by.to_string(),
        })
    }
}
