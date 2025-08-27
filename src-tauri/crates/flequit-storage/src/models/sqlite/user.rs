use chrono::{DateTime, Utc};
use sea_orm::{entity::prelude::*, Set};
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};
use crate::models::user::User;

/// User用SQLiteエンティティ定義
///
/// ユーザー管理の高速検索のためインデックス最適化
/// 名前、メール、ユーザー名による検索に対応
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    /// ユーザーの一意識別子
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// ユニークユーザー名（必須、@mention等で使用）
    #[sea_orm(indexed)] // 検索用インデックス
    pub username: String,

    /// 表示用名前（UI表示用、任意設定可能）
    pub display_name: Option<String>,

    /// メールアドレス（任意、通知や連絡で使用）
    #[sea_orm(indexed)] // 検索用インデックス
    pub email: Option<String>,

    /// プロフィール画像URL（外部サービス由来）
    pub avatar_url: Option<String>,

    /// 自己紹介文（任意）
    pub bio: Option<String>,

    /// タイムゾーン（任意）
    pub timezone: Option<String>,

    /// アクティブ状態（必須）
    pub is_active: bool,

    /// ユーザー作成日時
    #[sea_orm(indexed)] // 作成日順ソート用
    pub created_at: DateTime<Utc>,

    /// プロフィール最終更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

/// SQLiteモデルからドメインモデルへの変換
impl SqliteModelConverter<User> for Model {
    async fn to_domain_model(&self) -> Result<User, String> {
        use crate::types::id_types::UserId;

        Ok(User {
            id: UserId::from(self.id.clone()),
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            email: self.email.clone(),
            avatar_url: self.avatar_url.clone(),
            bio: self.bio.clone(),
            timezone: self.timezone.clone(),
            is_active: self.is_active,
            created_at: self.created_at,
            updated_at: self.updated_at,
        })
    }
}

/// ドメインモデルからSQLiteモデルへの変換
impl DomainToSqliteConverter<ActiveModel> for User {
    async fn to_sqlite_model(&self) -> Result<ActiveModel, String> {
        Ok(ActiveModel {
            id: Set(self.id.to_string()),
            username: Set(self.username.clone()),
            display_name: Set(self.display_name.clone()),
            email: Set(self.email.clone()),
            avatar_url: Set(self.avatar_url.clone()),
            bio: Set(self.bio.clone()),
            timezone: Set(self.timezone.clone()),
            is_active: Set(self.is_active),
            created_at: Set(self.created_at),
            updated_at: Set(self.updated_at),
        })
    }
}
