//! プロジェクトメンバーモデル用SQLiteエンティティ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::{
    models::task_projects::member::Member,
    types::{
        id_types::{MemberId, UserId},
        project_types::MemberRole,
    },
};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use super::{DomainToSqliteConverter, SqliteModelConverter};

/// Member用SQLiteエンティティ定義
///
/// プロジェクトメンバー情報を表現する構造体のSQLite版
/// ユーザーとプロジェクト間のN:N関係を管理し、役割と参加日時を記録
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "project_members")]
pub struct Model {
    /// メンバーID（主キー）
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,

    /// ユーザーID
    #[sea_orm(indexed)]
    pub user_id: String,

    /// プロジェクト内での役割（Owner、Member等）
    #[sea_orm(indexed)]
    pub role: String,

    /// プロジェクト参加日時
    #[sea_orm(indexed)]
    pub joined_at: DateTime<Utc>,

    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[async_trait]
impl SqliteModelConverter<Member> for Model {
    async fn to_domain_model(&self) -> Result<Member, String> {
        let role = match self.role.as_str() {
            "owner" => MemberRole::Owner,
            "admin" => MemberRole::Admin,
            "member" => MemberRole::Member,
            "viewer" => MemberRole::Viewer,
            _ => return Err(format!("Unknown role: {}", self.role)),
        };

        Ok(Member {
            id: MemberId::from(self.id.clone()),
            user_id: UserId::from(self.user_id.clone()),
            role,
            joined_at: self.joined_at,
            updated_at: self.updated_at,
        })
    }
}

#[async_trait]
impl DomainToSqliteConverter<Model> for Member {
    async fn to_sqlite_model(&self) -> Result<Model, String> {
        let role_str = match self.role {
            MemberRole::Owner => "owner",
            MemberRole::Admin => "admin",
            MemberRole::Member => "member",
            MemberRole::Viewer => "viewer",
        };

        Ok(Model {
            id: self.id.to_string(),
            user_id: self.user_id.to_string(),
            role: role_str.to_string(),
            joined_at: self.joined_at,
            updated_at: self.updated_at,
        })
    }
}
