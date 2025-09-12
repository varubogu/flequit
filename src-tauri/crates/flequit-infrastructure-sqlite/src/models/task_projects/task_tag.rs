use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::types::id_types::{TagId, TaskId};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};

/// TaskTag用SQLiteエンティティ定義
///
/// タスクとタグの多対多関係を管理する紐づけテーブル
/// 高速な検索・削除に最適化
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "task_tags")]
pub struct Model {
    /// タスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub task_id: String,

    /// タグID
    #[sea_orm(primary_key, auto_increment = false)]
    pub tag_id: String,

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
        belongs_to = "super::tag::Entity",
        from = "Column::TagId",
        to = "super::tag::Column::Id"
    )]
    Tag,
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Task.def()
    }
}

impl Related<super::tag::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tag.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<TaskTag> for Model {
    async fn to_domain_model(&self) -> Result<TaskTag, String> {
        Ok(TaskTag {
            task_id: TaskId::from(self.task_id.clone()),
            tag_id: TagId::from(self.tag_id.clone()),
            created_at: self.created_at,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for TaskTag {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        use sea_orm::ActiveValue::Set;
        Ok(ActiveModel {
            task_id: Set(self.task_id.to_string()),
            tag_id: Set(self.tag_id.to_string()),
            created_at: Set(self.created_at),
        })
    }
}
