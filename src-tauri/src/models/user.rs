//! ユーザー管理モデル
//! 
//! このモジュールはアプリケーション内でのユーザー情報を管理する構造体を定義します。
//! 
//! ## 概要
//! 
//! `User`構造体は、アプリケーション内でのユーザープロフィール情報を表現します。
//! 認証情報（`Account`）とは分離され、ユーザーの実体情報を管理します。

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::super::types::id_types::UserId;

use crate::models::{command::user::UserCommand, CommandModelConverter};

/// アプリケーションユーザー情報を表現する構造体
/// 
/// 認証後のユーザーの実体情報（プロフィール、表示名等）を管理します。
/// 認証情報は別途`Account`モデルで管理されます。
/// 
/// # フィールド
/// 
/// * `id` - ユーザーの一意識別子
/// * `name` - ユーザー名（必須、表示やメンション等で使用）
/// * `email` - メールアドレス（必須、通知や連絡で使用）
/// * `avatar_url` - プロフィール画像URL（外部サービス由来）
/// * `avatar` - ローカル保存されたアバター情報（Svelteフロントエンド対応）
/// * `username` - ユニークユーザー名（@mention等で使用）
/// * `display_name` - 表示用名前（UI表示用、任意設定可能）
/// * `created_at` - ユーザー作成日時
/// * `updated_at` - プロフィール最終更新日時
/// 
/// # フロントエンド互換性
/// 
/// 本構造体は、Svelteフロントエンドとの互換性を保つため、
/// 複数のアバター関連フィールド(`avatar_url`, `avatar`)を持ちます。
/// 
/// # 設計思想
/// 
/// - **ユーザー中心設計**: アプリケーション内でのユーザー体験に特化
/// - **プロフィール管理**: 表示名、アバター等のカスタマイズ可能な情報を重視
/// - **認証分離**: 認証情報とユーザー情報を明確に分離
/// 
/// # 使用例
/// 
/// ```rust
/// use chrono::Utc;
/// 
/// let user = User {
///     id: UserId::new(),
///     name: "john_doe".to_string(),
///     email: "john@example.com".to_string(),
///     avatar_url: Some("https://example.com/avatar.jpg".to_string()),
///     avatar: None,
///     username: Some("john_doe".to_string()),
///     display_name: Some("John Doe".to_string()),
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
/// };
/// ```
/// 
/// # 関連モデル
/// 
/// - [`crate::models::account::Account`] - 認証情報
/// - [`crate::models::project::ProjectMember`] - プロジェクトメンバーシップ
/// - [`crate::models::task::Task`] - タスク担当者情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// ユーザーの一意識別子
    pub id: UserId,
    /// ユーザー名（必須、表示やメンション等で使用）
    pub name: String,
    /// メールアドレス（必須、通知や連絡で使用）
    pub email: String,
    /// プロフィール画像URL（外部サービス由来）
    pub avatar_url: Option<String>, // avatar_urlフィールド（診断エラー対応用に追加フィールドも）
    /// ローカル保存されたアバター情報（Svelteフロントエンド対応）
    pub avatar: Option<String>, // Svelte側のavatarフィールドに対応
    /// ユニークユーザー名（@mention等で使用）
    pub username: Option<String>, // 診断エラーで必要とされているフィールド
    /// 表示用名前（UI表示用、任意設定可能）
    pub display_name: Option<String>, // 診断エラーで必要とされているフィールド
    /// ユーザー作成日時
    pub created_at: DateTime<Utc>,
    /// プロフィール最終更新日時
    pub updated_at: DateTime<Utc>,
}

impl CommandModelConverter<UserCommand> for User {
    async fn to_command_model(&self) -> Result<UserCommand, String> {
        Ok(UserCommand {
            id: self.id.to_string(),
            name: self.name.clone(),
            email: self.email.clone(),
            avatar_url: self.avatar_url.clone(),
            avatar: self.avatar.clone(),
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}