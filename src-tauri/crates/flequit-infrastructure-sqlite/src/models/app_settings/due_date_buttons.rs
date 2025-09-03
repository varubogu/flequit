//! 期限日ボタン設定モデル用SQLiteエンティティ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::app_settings::due_date_buttons::DueDateButtons;
use sea_orm::{entity::prelude::*};
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};

/// DueDateButtons用SQLiteエンティティ定義
///
/// 期限日入力UIのボタン設定を管理する構造体のSQLite版
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "due_date_buttons")]
pub struct Model {
    /// ボタンの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// ボタンの表示名
    pub name: String,

    /// 表示/非表示フラグ
    #[sea_orm(indexed)]
    pub is_visible: bool,

    /// 表示順序
    #[sea_orm(indexed)]
    pub display_order: i32,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<DueDateButtons> for Model {
    async fn to_domain_model(&self) -> Result<DueDateButtons, String> {
        Ok(DueDateButtons {
            id: self.id.clone(),
            name: self.name.clone(),
            is_visible: self.is_visible,
            display_order: self.display_order,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<Model> for DueDateButtons {
    async fn to_sqlite_model(&self) -> Result<Model, String> {
        Ok(Model {
            id: self.id.clone(),
            name: self.name.clone(),
            is_visible: self.is_visible,
            display_order: self.display_order,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }
}