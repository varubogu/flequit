use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// RecurrenceDaysOfWeek用SQLiteエンティティ定義
///
/// 繰り返しルールと曜日の多対多関係を管理する紐づけテーブル
/// 週次繰り返しで特定曜日を指定する場合に使用
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "recurrence_days_of_week")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// 繰り返しルールID
    #[sea_orm(primary_key, auto_increment = false)]
    pub recurrence_rule_id: String,

    /// 曜日（monday, tuesday, wednesday, thursday, friday, saturday, sunday）
    #[sea_orm(primary_key, auto_increment = false)]
    pub day_of_week: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::recurrence_rule::Entity",
        from = "Column::RecurrenceRuleId",
        to = "super::recurrence_rule::Column::Id"
    )]
    RecurrenceRule,
}

impl Related<super::recurrence_rule::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceRule.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
