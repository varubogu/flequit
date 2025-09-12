use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// TaskRecurrence用SQLiteエンティティ定義
///
/// タスクと繰り返しルールの関係を管理する紐づけテーブル
/// 繰り返しルールIDとの関連を管理
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "task_recurrence")]
pub struct Model {
    /// タスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub task_id: String,

    /// 繰り返しルールID（将来的にルールIDで管理する想定）
    #[sea_orm(primary_key, auto_increment = false)]
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::TaskId",
        to = "super::task::Column::Id"
    )]
    Task,
    #[sea_orm(
        belongs_to = "super::recurrence_rule::Entity",
        from = "Column::RecurrenceRuleId",
        to = "super::recurrence_rule::Column::Id"
    )]
    RecurrenceRule,
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl Related<super::recurrence_rule::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceRule.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
