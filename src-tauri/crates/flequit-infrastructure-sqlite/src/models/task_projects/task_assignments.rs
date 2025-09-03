use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// TaskAssignment用SQLiteエンティティ定義
///
/// タスクとユーザーの多対多関係を管理する紐づけテーブル
/// 高速な検索・削除に最適化
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "task_assignments")]
pub struct Model {
    /// タスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub task_id: String,

    /// ユーザーID
    #[sea_orm(primary_key, auto_increment = false)]
    pub user_id: String,

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
        belongs_to = "crate::models::user::Entity",
        from = "Column::UserId",
        to = "crate::models::user::Column::Id"
    )]
    User,
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl Related<crate::models::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}