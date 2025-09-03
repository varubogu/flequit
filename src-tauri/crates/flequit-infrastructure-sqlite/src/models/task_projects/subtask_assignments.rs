use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// SubTaskAssignment用SQLiteエンティティ定義
///
/// サブタスクとユーザーの多対多関係を管理する紐づけテーブル
/// 高速な検索・削除に最適化
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "subtask_assignments")]
pub struct Model {
    /// サブタスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub subtask_id: String,

    /// ユーザーID
    #[sea_orm(primary_key, auto_increment = false)]
    pub user_id: String,

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
        belongs_to = "crate::models::user::Entity",
        from = "Column::UserId",
        to = "crate::models::user::Column::Id"
    )]
    User,
}

impl Related<super::subtask::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Subtask.def()
    }
}

impl Related<crate::models::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
