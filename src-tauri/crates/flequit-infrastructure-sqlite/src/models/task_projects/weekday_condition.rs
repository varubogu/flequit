//! 曜日条件モデル用SQLiteエンティティ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::task_projects::weekday_condition::WeekdayCondition,
    types::{
        datetime_calendar_types::{AdjustmentDirection, AdjustmentTarget, DayOfWeek},
        id_types::{ProjectId, WeekdayConditionId},
    },
};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::DomainToSqliteConverterWithProjectId;

use super::SqliteModelConverter;

/// WeekdayCondition用SQLiteエンティティ定義
///
/// 曜日に基づく条件調整を表現する構造体のSQLite版
/// ビジネス日への調整や曜日固定のタスク管理に使用されます
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "weekday_conditions")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// 条件の一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 判定対象の曜日
    #[sea_orm(indexed)]
    pub if_weekday: String,

    /// 調整方向（前・後・最近等）
    pub then_direction: String,

    /// 調整対象（平日・特定曜日・日数等）
    pub then_target: String,

    /// 調整先の曜日（target=特定曜日の場合）
    pub then_weekday: Option<String>,

    /// 調整日数（target=日数の場合）
    pub then_days: Option<i32>,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<WeekdayCondition> for Model {
    async fn to_domain_model(&self) -> Result<WeekdayCondition, String> {
        let if_weekday = match self.if_weekday.as_str() {
            "monday" => DayOfWeek::Monday,
            "tuesday" => DayOfWeek::Tuesday,
            "wednesday" => DayOfWeek::Wednesday,
            "thursday" => DayOfWeek::Thursday,
            "friday" => DayOfWeek::Friday,
            "saturday" => DayOfWeek::Saturday,
            "sunday" => DayOfWeek::Sunday,
            _ => return Err(format!("Unknown weekday: {}", self.if_weekday)),
        };

        let then_direction = match self.then_direction.as_str() {
            "previous" => AdjustmentDirection::Previous,
            "next" => AdjustmentDirection::Next,
            "nearest" => AdjustmentDirection::Nearest,
            _ => return Err(format!("Unknown direction: {}", self.then_direction)),
        };

        let then_target = match self.then_target.as_str() {
            "weekday" => AdjustmentTarget::Weekday,
            "weekend" => AdjustmentTarget::Weekend,
            "holiday" => AdjustmentTarget::Holiday,
            "non_holiday" => AdjustmentTarget::NonHoliday,
            "weekend_only" => AdjustmentTarget::WeekendOnly,
            "non_weekend" => AdjustmentTarget::NonWeekend,
            "weekend_holiday" => AdjustmentTarget::WeekendHoliday,
            "non_weekend_holiday" => AdjustmentTarget::NonWeekendHoliday,
            "specific_weekday" => AdjustmentTarget::SpecificWeekday,
            "days" => AdjustmentTarget::Days,
            _ => return Err(format!("Unknown target: {}", self.then_target)),
        };

        let then_weekday = self.then_weekday.as_ref().and_then(|w| match w.as_str() {
            "monday" => Some(DayOfWeek::Monday),
            "tuesday" => Some(DayOfWeek::Tuesday),
            "wednesday" => Some(DayOfWeek::Wednesday),
            "thursday" => Some(DayOfWeek::Thursday),
            "friday" => Some(DayOfWeek::Friday),
            "saturday" => Some(DayOfWeek::Saturday),
            "sunday" => Some(DayOfWeek::Sunday),
            _ => None,
        });

        Ok(WeekdayCondition {
            id: WeekdayConditionId::from(self.id.clone()),
            if_weekday,
            then_direction,
            then_target,
            then_weekday,
            then_days: self.then_days,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverterWithProjectId<Model> for WeekdayCondition {
    async fn to_sqlite_model_with_project_id(&self, project_id: &ProjectId) -> Result<Model, String> {
        let if_weekday_str = match self.if_weekday {
            DayOfWeek::Monday => "monday",
            DayOfWeek::Tuesday => "tuesday",
            DayOfWeek::Wednesday => "wednesday",
            DayOfWeek::Thursday => "thursday",
            DayOfWeek::Friday => "friday",
            DayOfWeek::Saturday => "saturday",
            DayOfWeek::Sunday => "sunday",
        };

        let then_direction_str = match self.then_direction {
            AdjustmentDirection::Previous => "previous",
            AdjustmentDirection::Next => "next",
            AdjustmentDirection::Nearest => "nearest",
        };

        let then_target_str = match self.then_target {
            AdjustmentTarget::Weekday => "weekday",
            AdjustmentTarget::Weekend => "weekend",
            AdjustmentTarget::Holiday => "holiday",
            AdjustmentTarget::NonHoliday => "non_holiday",
            AdjustmentTarget::WeekendOnly => "weekend_only",
            AdjustmentTarget::NonWeekend => "non_weekend",
            AdjustmentTarget::WeekendHoliday => "weekend_holiday",
            AdjustmentTarget::NonWeekendHoliday => "non_weekend_holiday",
            AdjustmentTarget::SpecificWeekday => "specific_weekday",
            AdjustmentTarget::Days => "days",
        };

        let then_weekday_str = self.then_weekday.as_ref().map(|w| match w {
            DayOfWeek::Monday => "monday".to_string(),
            DayOfWeek::Tuesday => "tuesday".to_string(),
            DayOfWeek::Wednesday => "wednesday".to_string(),
            DayOfWeek::Thursday => "thursday".to_string(),
            DayOfWeek::Friday => "friday".to_string(),
            DayOfWeek::Saturday => "saturday".to_string(),
            DayOfWeek::Sunday => "sunday".to_string(),
        });

        Ok(Model {
            id: self.id.to_string(),
            project_id: project_id.to_string(),
            if_weekday: if_weekday_str.to_string(),
            then_direction: then_direction_str.to_string(),
            then_target: then_target_str.to_string(),
            then_weekday: then_weekday_str,
            then_days: self.then_days,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }
}
