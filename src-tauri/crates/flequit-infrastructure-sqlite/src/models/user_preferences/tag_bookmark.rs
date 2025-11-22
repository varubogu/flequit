use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::user_preferences::tag_bookmark::TagBookmark,
    types::id_types::{ProjectId, TagBookmarkId, TagId, UserId},
};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use crate::models::DomainToSqliteConverter;

use super::super::SqliteModelConverter;

/// TagBookmark用SQLiteエンティティ定義
///
/// サイドバーのタグブックマーク（ピン留め）情報を管理
/// ユーザーごと、プロジェクトごとのブックマーク状態を高速に検索・ソート
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "user_tag_bookmarks")]
pub struct Model {
    /// ブックマークの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// ユーザーID（現在は固定値 "local_user"）
    #[sea_orm(indexed)]
    pub user_id: String,

    /// タグの所属プロジェクトID
    #[sea_orm(indexed)]
    pub project_id: String,

    /// ブックマークするタグID
    #[sea_orm(indexed)]
    pub tag_id: String,

    /// サイドバー内での表示順序
    #[sea_orm(indexed)]
    pub order_index: i32,

    /// ブックマーク追加日時
    pub created_at: DateTime<Utc>,

    /// ブックマーク更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
#[async_trait]
impl SqliteModelConverter<TagBookmark> for Model {
    async fn to_domain_model(&self) -> Result<TagBookmark, String> {
        Ok(TagBookmark {
            id: TagBookmarkId::from(self.id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            project_id: ProjectId::from(self.project_id.clone()),
            tag_id: TagId::from(self.tag_id.clone()),
            order_index: self.order_index,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for TagBookmark {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            user_id: Set(self.user_id.to_string()),
            project_id: Set(self.project_id.to_string()),
            tag_id: Set(self.tag_id.to_string()),
            order_index: Set(self.order_index),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
        })
    }
}
