use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// RecurrenceAdjustment用SQLiteエンティティ定義
///
/// 繰り返しルールの調整条件を管理するテーブル
/// 営業日調整や祝日回避等の補正条件を定義
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_adjustments")]
pub struct Model {
    /// 調整条件の一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 繰り返しルールID
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
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
