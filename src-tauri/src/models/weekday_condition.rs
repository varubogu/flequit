//! 曜日条件コマンドモデル

use async_trait::async_trait;
use flequit_model::{
    models::{task_projects::weekday_condition::WeekdayCondition, ModelConverter},
    types::{
        datetime_calendar_types::{AdjustmentDirection, AdjustmentTarget, DayOfWeek},
        id_types::WeekdayConditionId,
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
}

#[async_trait]
impl ModelConverter<WeekdayCondition> for WeekdayConditionCommandModel {
    /// コマンド引数用（WeekdayConditionCommand）から内部モデル（WeekdayCondition）に変換
    async fn to_model(&self) -> Result<WeekdayCondition, String> {
        Ok(WeekdayCondition {
            id: WeekdayConditionId::from(self.id.clone()),
            if_weekday: self.if_weekday.clone(),
            then_direction: self.then_direction.clone(),
            then_target: self.then_target.clone(),
            then_weekday: self.then_weekday.clone(),
            then_days: self.then_days,
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
        })
    }
}
