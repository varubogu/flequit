//! プロジェクトメンバーモデル用Automergeエンティティ

use chrono::{DateTime, Utc};
use flequit_model::{
    models::task_projects::member::Member,
    types::{id_types::UserId, project_types::MemberRole},
};
use serde::{Deserialize, Serialize};

/// Member用Automergeエンティティ
///
/// プロジェクトメンバー情報を表現する構造体のAutomerge版
/// ユーザーとプロジェクト間のN:N関係を管理し、役割と参加日時を記録
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemberAutomerge {
    /// メンバーID
    pub id: String,

    /// メンバーのユーザーID
    pub user_id: String,

    /// プロジェクト内での役割（Owner、Member等）
    pub role: String,

    /// プロジェクト参加日時
    pub joined_at: DateTime<Utc>,

    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

impl MemberAutomerge {
    /// ドメインモデルから変換
    pub fn from_domain(domain: Member) -> Self {
        let role_str = match domain.role {
            MemberRole::Owner => "owner",
            MemberRole::Admin => "admin",
            MemberRole::Member => "member",
            MemberRole::Viewer => "viewer",
        };

        Self {
            id: domain.id.to_string(),
            user_id: domain.user_id.to_string(),
            role: role_str.to_string(),
            joined_at: domain.joined_at,
            updated_at: domain.updated_at,
        }
    }

    /// ドメインモデルに変換
    pub fn to_domain(self) -> Result<Member, String> {
        let role = match self.role.as_str() {
            "owner" => MemberRole::Owner,
            "admin" => MemberRole::Admin,
            "member" => MemberRole::Member,
            "viewer" => MemberRole::Viewer,
            _ => return Err(format!("Unknown role: {}", self.role)),
        };

        Ok(Member {
            id: flequit_model::types::id_types::MemberId::from(self.id),
            user_id: UserId::from(self.user_id),
            role,
            joined_at: self.joined_at,
            updated_at: self.updated_at,
        })
    }
}
