//! 日付条件コマンドモデル

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::{task_projects::date_condition::DateCondition, ModelConverter},
    types::{datetime_calendar_types::DateRelation, id_types::DateConditionId},
};
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DateConditionCommandModel {
    pub id: String,
    pub relation: DateRelation,
    pub reference_date: DateTime<Utc>,
}

#[async_trait]
impl ModelConverter<DateCondition> for DateConditionCommandModel {
    /// コマンド引数用（DateConditionCommand）から内部モデル（DateCondition）に変換
    async fn to_model(&self) -> Result<DateCondition, String> {
        Ok(DateCondition {
            id: DateConditionId::from(self.id.clone()),
            relation: self.relation.clone(),
            reference_date: self.reference_date,
        })
    }
}

#[async_trait]
impl CommandModelConverter<DateConditionCommandModel> for DateCondition {
    /// ドメインモデル（DateCondition）からコマンドモデル（DateConditionCommand）に変換
    async fn to_command_model(&self) -> Result<DateConditionCommandModel, String> {
        Ok(DateConditionCommandModel {
            id: self.id.to_string(),
            relation: self.relation.clone(),
            reference_date: self.reference_date,
        })
    }
}
