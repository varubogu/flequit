use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment;
use flequit_model::types::id_types::{ProjectId, RecurrenceAdjustmentId, RecurrenceRuleId, UserId};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};

/// RecurrenceAdjustment用SQLiteエンティティ定義
///
/// 繰り返しルールの調整条件を管理するテーブル
/// 営業日調整や祝日回避等の補正条件を定義
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_adjustments")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// 調整条件の一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,

    /// 最終更新者のユーザーID
    pub updated_by: String,

    /// 論理削除フラグ
    #[sea_orm(indexed)]
    pub deleted: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::recurrence_rule::Entity",
        from = "Column::RecurrenceRuleId",
        to = "super::recurrence_rule::Column::Id"
    )]
    RecurrenceRule,
    #[sea_orm(has_many = "super::recurrence_date_condition::Entity")]
    DateConditions,
    #[sea_orm(has_many = "super::recurrence_weekday_condition::Entity")]
    WeekdayConditions,
}

impl Related<super::recurrence_rule::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceRule.def()
    }
}

impl Related<super::recurrence_date_condition::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::DateConditions.def()
    }
}

impl Related<super::recurrence_weekday_condition::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::WeekdayConditions.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<RecurrenceAdjustment> for Model {
    async fn to_domain_model(&self) -> Result<RecurrenceAdjustment, String> {
        Ok(RecurrenceAdjustment {
            id: RecurrenceAdjustmentId::from(self.id.clone()),
            recurrence_rule_id: RecurrenceRuleId::from(self.recurrence_rule_id.clone()),
            date_conditions: vec![],
            weekday_conditions: vec![],
            created_at: self.created_at,
            updated_at: self.updated_at,
            updated_by: UserId::from(self.updated_by.clone()),
            deleted: self.deleted,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverterWithProjectId<ActiveModel> for RecurrenceAdjustment {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<ActiveModel, String> {
        use sea_orm::ActiveValue::Set;
        Ok(ActiveModel {
            project_id: Set(project_id.to_string()),
            id: Set(self.id.to_string()),
            recurrence_rule_id: Set(self.recurrence_rule_id.to_string()),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
            updated_by: Set(self.updated_by.to_string()),
            deleted: Set(self.deleted),
        })
    }
}
