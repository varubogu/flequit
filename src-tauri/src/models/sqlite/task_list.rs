use chrono::{DateTime, Utc};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};
use crate::{models::task_list::TaskList, types::id_types::TaskListId};

/// TaskList用SQLiteエンティティ定義
///
/// プロジェクト内のタスクリスト管理に最適化
/// プロジェクト別検索、表示順序ソートに対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "task_lists")]
pub struct Model {
    /// タスクリストの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 所属プロジェクトID
    #[sea_orm(indexed)] // プロジェクト別検索用
    pub project_id: String,

    /// タスクリスト名
    pub name: String,

    /// タスクリスト説明
    pub description: Option<String>,

    /// UI表示用のカラーコード
    pub color: Option<String>,

    /// 表示順序
    #[sea_orm(indexed)] // ソート用
    pub order_index: i32,

    /// アーカイブ状態フラグ
    #[sea_orm(indexed)] // アーカイブフィルタ用
    pub is_archived: bool,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::project::Entity",
        from = "Column::ProjectId",
        to = "super::project::Column::Id"
    )]
    Project,
    #[sea_orm(has_many = "super::task::Entity")]
    Tasks,
}

impl Related<super::project::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Project.def()
    }
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tasks.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
impl SqliteModelConverter<TaskList> for Model {
    async fn to_domain_model(&self) -> Result<TaskList, String> {
        Ok(TaskList {
            id: TaskListId::from(self.id.clone()),
            project_id: crate::types::id_types::ProjectId::from(self.project_id.clone()),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
impl DomainToSqliteConverter<ActiveModel> for TaskList {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            project_id: Set(self.project_id.to_string()),
            name: Set(self.name.clone()),
            description: Set(self.description.clone()),
            color: Set(self.color.clone()),
            order_index: Set(self.order_index),
            is_archived: Set(self.is_archived),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
        })
    }
}
