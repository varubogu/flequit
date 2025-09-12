use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// RecurrenceDetail用SQLiteエンティティ定義
///
/// 繰り返しルールの詳細設定を管理するテーブル
/// 月の特定日、特定週の特定曜日などの詳細パターンを定義
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_details")]
pub struct Model {
    /// 繰り返しルールID（1対1の関係）
    #[sea_orm(primary_key, auto_increment = false)]
    pub recurrence_rule_id: String,

    /// 月の特定日（1-31、月次繰り返し時）
    pub specific_date: Option<i32>,

    /// 期間内の特定週（first, second, third, fourth, last等の文字列形式）
    pub week_of_period: Option<String>,

    /// 週の特定曜日（monday, tuesday, ...等の文字列形式）
    pub weekday_of_week: Option<String>,

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

impl ActiveModelBehavior for ActiveModel {}
