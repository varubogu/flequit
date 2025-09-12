use chrono::{DateTime, Utc};
use flequit_model::{models::users::user::User, types::id_types::UserId};
use serde::{Deserialize, Serialize};

/// User用Automergeエンティティ定義
///
/// ユーザー管理のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct UserDocument {
    /// ユーザーの一意識別子
    pub id: String,

    /// ユニークユーザー名（必須、@mention等で使用）
    pub handle_id: String,

    /// 表示用名前（UI表示用、任意設定可能）
    pub display_name: String,

    /// メールアドレス（任意、通知や連絡で使用）
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
    pub created_at: DateTime<Utc>,

    /// プロフィール最終更新日時
    pub updated_at: DateTime<Utc>,
}

impl UserDocument {
    /// ドメインモデルからAutomergeドキュメントに変換
    pub fn from_domain_model(user: User) -> Self {
        Self {
            id: user.id.to_string(),
            handle_id: user.handle_id,
            display_name: user.display_name,
            email: user.email,
            avatar_url: user.avatar_url,
            bio: user.bio,
            timezone: user.timezone,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }

    /// Automergeドキュメントからドメインモデルに変換
    pub fn to_domain_model(&self) -> Result<User, String> {
        Ok(User {
            id: UserId::try_from_str(&self.id).map_err(|e| e.to_string())?,
            handle_id: self.handle_id.clone(),
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
