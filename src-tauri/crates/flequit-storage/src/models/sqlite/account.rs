use chrono::{DateTime, Utc};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};
use crate::models::account::Account;

/// Account用SQLiteエンティティ定義
///
/// アカウント管理の高速検索のためインデックス最適化
/// プロバイダー別検索、アクティブ状態フィルタリングに対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "accounts")]
pub struct Model {
    /// アカウントの内部識別子（機密）
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// 公開ユーザー識別子（他者から参照可能、プロジェクト共有用）
    #[sea_orm(indexed)] // 外部参照用インデックス
    pub user_id: String,

    /// メールアドレス
    #[sea_orm(indexed)] // 検索用インデックス
    pub email: Option<String>,

    /// 表示名
    pub display_name: Option<String>,

    /// アバターURL
    pub avatar_url: Option<String>,

    /// プロバイダー ("local", "github", "google" など)
    #[sea_orm(indexed)] // プロバイダー別検索用
    pub provider: String,

    /// プロバイダー固有ID
    pub provider_id: Option<String>,

    /// アクティブ状態
    #[sea_orm(indexed)] // アクティブフィルタ用
    pub is_active: bool,

    /// 作成日時
    #[sea_orm(indexed)] // 作成日順ソート用
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
impl SqliteModelConverter<Account> for Model {
    async fn to_domain_model(&self) -> Result<Account, String> {
        use crate::types::id_types::{AccountId, UserId};

        Ok(Account {
            id: AccountId::from(self.id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            email: self.email.clone(),
            display_name: self.display_name.clone(),
            avatar_url: self.avatar_url.clone(),
            provider: self.provider.clone(),
            provider_id: self.provider_id.clone(),
            is_active: self.is_active,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
impl DomainToSqliteConverter<ActiveModel> for Account {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            user_id: Set(self.user_id.to_string()),
            email: Set(self.email.clone()),
            display_name: Set(self.display_name.clone()),
            avatar_url: Set(self.avatar_url.clone()),
            provider: Set(self.provider.clone()),
            provider_id: Set(self.provider_id.clone()),
            is_active: Set(self.is_active),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
        })
    }
}
