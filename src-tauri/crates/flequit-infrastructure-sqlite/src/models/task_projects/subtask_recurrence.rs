use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// SubTaskRecurrence用SQLiteエンティティ定義
///
/// サブタスクと繰り返しルールの関係を管理する紐づけテーブル
/// 繰り返しルールIDとの関連を管理
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "subtask_recurrence")]
pub struct Model {
    /// サブタスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub subtask_id: String,

    /// 繰り返しルールID（将来的にルールIDで管理する想定）
    #[sea_orm(primary_key, auto_increment = false)]
    pub recurrence_rule_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::subtask::Entity",
        from = "Column::SubtaskId",
        to = "super::subtask::Column::Id"
    )]
    Subtask,
    #[sea_orm(
        belongs_to = "super::recurrence_rule::Entity",
        from = "Column::RecurrenceRuleId",
        to = "super::recurrence_rule::Column::Id"
    )]
    RecurrenceRule,
}

impl Related<super::subtask::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Subtask.def()
    }
}

impl Related<super::recurrence_rule::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RecurrenceRule.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
