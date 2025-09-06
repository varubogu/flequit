use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{TaskId, UserId};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use super::{SqliteModelConverter, DomainToSqliteConverter};

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

#[async_trait]
impl SqliteModelConverter<TaskAssignment> for Model {
    async fn to_domain_model(&self) -> Result<TaskAssignment, String> {
        Ok(TaskAssignment {
            task_id: TaskId::from(self.task_id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            created_at: self.created_at,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for TaskAssignment {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        use sea_orm::ActiveValue::Set;
        Ok(ActiveModel {
            task_id: Set(self.task_id.to_string()),
            user_id: Set(self.user_id.to_string()),
            created_at: Set(self.created_at),
        })
    }
}