use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::task_projects::tag::Tag,
    types::id_types::{ProjectId, TagId, UserId},
};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use crate::models::{DomainToSqliteConverter, DomainToSqliteConverterWithProjectId};

use super::SqliteModelConverter;

/// Tag用SQLiteエンティティ定義
///
/// タグ管理の高速検索・ソートに最適化
/// 名前検索、色別フィルタ、使用頻度ソートに対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "tags")]
pub struct Model {
    /// プロジェクトID（SQLite統合テーブル用）
    #[sea_orm(primary_key, auto_increment = false)]
    pub project_id: String,

    /// タグの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// タグ名
    #[sea_orm(indexed)] // 名前検索用
    pub name: String,

    /// タグの色（16進数カラーコード）
    #[sea_orm(indexed)] // 色別検索用
    pub color: Option<String>,

    /// 表示順序
    #[sea_orm(indexed)] // ソート用
    pub order_index: Option<i32>,

    /// 使用回数（キャッシュ用）
    #[sea_orm(indexed)] // 人気順ソート用
    pub usage_count: i32,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,

    /// 論理削除フラグ
    #[sea_orm(indexed)]
    pub deleted: bool,

    /// 最終更新者のユーザーID
    pub updated_by: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {
    /// タグ作成時に使用回数を0で初期化
    fn new() -> Self {
        Self {
            usage_count: Set(0),
            ..Default::default()
        }
    }
}

/// SQLiteモデルからドメインモデルへの変換
#[async_trait]
impl SqliteModelConverter<Tag> for Model {
    async fn to_domain_model(&self) -> Result<Tag, String> {
        Ok(Tag {
            id: TagId::from(self.id.clone()),
            name: self.name.clone(),
            color: self.color.clone(),
            order_index: self.order_index,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            updated_by: UserId::from(self.updated_by.clone()),
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
/// 注意: project_idは別途設定する必要があります
#[async_trait]
impl DomainToSqliteConverter<ActiveModel> for Tag {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            project_id: sea_orm::NotSet, // リポジトリ層で設定
            name: Set(self.name.clone()),
            color: Set(self.color.clone()),
            order_index: Set(self.order_index),
            usage_count: Set(0), // 新規作成時は0
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
            deleted: Set(self.deleted),
            updated_by: Set(self.updated_by.to_string()),
        })
    }
}

/// プロジェクトID付きのドメインモデルからSQLiteモデルへの変換
#[async_trait]
impl DomainToSqliteConverterWithProjectId<ActiveModel> for Tag {
    async fn to_sqlite_model_with_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            project_id: Set(project_id.to_string()),
            name: Set(self.name.clone()),
            color: Set(self.color.clone()),
            order_index: Set(self.order_index),
            usage_count: Set(0), // 新規作成時は0
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
            deleted: Set(self.deleted),
            updated_by: Set(self.updated_by.to_string()),
        })
    }
}

/// タグの使用回数を更新するための追加メソッド
impl ActiveModel {
    /// タグの使用回数をインクリメント

    pub fn increment_usage(mut self) -> Self {
        if let Set(current_count) = self.usage_count {
            self.usage_count = Set(current_count + 1);
        }
        self.updated_at = Set(chrono::Utc::now());
        self
    }

    /// タグの使用回数をデクリメント（0未満にはならない）

    pub fn decrement_usage(mut self) -> Self {
        if let Set(current_count) = self.usage_count {
            self.usage_count = Set((current_count - 1).max(0));
        }
        self.updated_at = Set(chrono::Utc::now());
        self
    }
}
