use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::DomainToSqliteConverterWithProjectId;

use super::SqliteModelConverter;

/// SubtaskTag用SQLiteエンティティ定義
///
/// サブタスクとタグの多対多関係を管理する紐づけテーブル
/// 高速な検索・削除に最適化
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "subtask_tags")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// サブタスクID
    #[sea_orm(primary_key, auto_increment = false)]
    pub subtask_id: String,

    /// タグID
    #[sea_orm(primary_key, auto_increment = false)]
    pub tag_id: String,

    /// 作成日時
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::subtask::Entity",
        from = "(Column::ProjectId, Column::SubtaskId)",
        to = "(super::subtask::Column::ProjectId, super::subtask::Column::Id)"
    )]
    Subtask,
    #[sea_orm(
        belongs_to = "super::tag::Entity",
        from = "(Column::ProjectId, Column::TagId)",
        to = "(super::tag::Column::ProjectId, super::tag::Column::Id)"
    )]
    Tag,
}

impl Related<super::subtask::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Subtask.def()
    }
}

impl Related<super::tag::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tag.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<SubTaskTag> for Model {
    async fn to_domain_model(&self) -> Result<SubTaskTag, String> {
        Ok(SubTaskTag {
            subtask_id: SubTaskId::from(self.subtask_id.clone()),
            tag_id: TagId::from(self.tag_id.clone()),
            created_at: self.created_at,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverterWithProjectId<ActiveModel> for SubTaskTag {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<ActiveModel, String> {
        use sea_orm::ActiveValue::Set;
        Ok(ActiveModel {
            subtask_id: Set(self.subtask_id.to_string()),
            project_id: Set(project_id.to_string()),
            tag_id: Set(self.tag_id.to_string()),
            created_at: Set(self.created_at),
        })
    }
}
