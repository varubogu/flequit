use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::project::Project;
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};

/// Project用SQLiteエンティティ定義
///
/// プロジェクト管理の高速検索・ソートに最適化
/// ステータス、表示順序での検索・ソートに対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "projects")]
pub struct Model {
    /// プロジェクトの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// プロジェクト名
    #[sea_orm(indexed)] // 名前検索用
    pub name: String,

    /// プロジェクト説明
    pub description: Option<String>,

    /// UI表示用のカラーコード
    pub color: Option<String>,

    /// 表示順序
    #[sea_orm(indexed)] // ソート用
    pub order_index: i32,

    /// アーカイブ状態フラグ
    #[sea_orm(indexed)] // アーカイブフィルタ用
    pub is_archived: bool,

    /// プロジェクトステータス（文字列形式、Optional）
    #[sea_orm(indexed)] // ステータス別検索用
    pub status: Option<String>,

    /// プロジェクトオーナーのユーザーID
    #[sea_orm(indexed)] // オーナー別検索用
    pub owner_id: Option<String>,

    /// 作成日時
    #[sea_orm(indexed)] // 作成日順ソート用
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::task_list::Entity")]
    TaskLists,
    #[sea_orm(has_many = "super::task::Entity")]
    Tasks,
}

impl Related<super::task_list::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TaskLists.def()
    }
}

impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tasks.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
#[async_trait]
impl SqliteModelConverter<Project> for Model {
    async fn to_domain_model(&self) -> Result<Project, String> {

        // ステータス文字列をenumに変換
        let status = if let Some(status_str) = &self.status {
            match status_str.as_str() {
                "planning" => Some(ProjectStatus::Planning),
                "active" => Some(ProjectStatus::Active),
                "on_hold" => Some(ProjectStatus::OnHold),
                "completed" => Some(ProjectStatus::Completed),
                _ => return Err(format!("Unknown project status: {}", status_str)),
            }
        } else {
            None
        };

        Ok(Project {
            id: ProjectId::from(self.id.clone()),
            name: self.name.clone(),
            description: self.description.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            is_archived: self.is_archived,
            status,
            owner_id: self.owner_id.as_ref().map(|id| UserId::from(id.clone())),
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for Project {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        // enumを文字列に変換
        let status_string = self.status.as_ref().map(|status| {
            match status {
                ProjectStatus::Planning => "planning",
                ProjectStatus::Active => "active",
                ProjectStatus::OnHold => "on_hold",
                ProjectStatus::Completed => "completed",
            }
            .to_string()
        });

        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            name: Set(self.name.clone()),
            description: Set(self.description.clone()),
            color: Set(self.color.clone()),
            order_index: Set(self.order_index),
            is_archived: Set(self.is_archived),
            status: Set(status_string),
            owner_id: Set(self.owner_id.as_ref().map(|id| id.to_string())),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
        })
    }
}
