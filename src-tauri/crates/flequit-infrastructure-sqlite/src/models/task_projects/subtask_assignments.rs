use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::types::id_types::{SubTaskId, UserId};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};

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

#[async_trait]
impl SqliteModelConverter<SubTaskAssignment> for Model {
    async fn to_domain_model(&self) -> Result<SubTaskAssignment, String> {
        Ok(SubTaskAssignment {
            subtask_id: SubTaskId::from(self.subtask_id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            created_at: self.created_at,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for SubTaskAssignment {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        use sea_orm::ActiveValue::Set;
        Ok(ActiveModel {
            subtask_id: Set(self.subtask_id.to_string()),
            user_id: Set(self.user_id.to_string()),
            created_at: Set(self.created_at),
        })
    }
}
