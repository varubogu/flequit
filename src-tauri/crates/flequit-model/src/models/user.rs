//! ユーザー管理モデル
//!
//! このモジュールはアプリケーション内でのユーザー情報を管理する構造体を定義します。
//!
//! ## 概要
//!
//! `User`構造体は、アプリケーション内でのユーザープロフィール情報を表現します。
//! `UserDocument`構造体は、複数のユーザー情報を配列として管理するAutomergeドキュメントです。
//! 認証情報（`Account`）とは分離され、ユーザーの実体情報を管理します。
//!
//! ## 操作制約
//!
//! User Documentは以下の特別な制約があります：
//! - **追加**: 新しいユーザープロフィールの追加は常に可能
//! - **更新**: 既存のユーザープロフィールの更新は可能
//! - **削除**: ユーザープロフィールの削除は不可（情報蓄積方式）
//! - **編集権限**: 自分のAccount.user_idにマッチするプロフィールのみ編集可能

use super::super::types::id_types::UserId;
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};


/// アプリケーションユーザー情報を表現する構造体
///
/// 認証後のユーザーの実体情報（プロフィール、表示名等）を管理します。
/// 認証情報は別途`Account`モデルで管理されます。
///
/// # フィールド
///
/// * `id` - ユーザーの公開識別子（他者から参照可能、プロジェクト共有用）
/// * `username` - ユニークユーザー名（必須、@mention等で使用）
/// * `display_name` - 表示用名前（UI表示用、任意設定可能）
/// * `email` - メールアドレス（任意、通知や連絡で使用）
/// * `avatar_url` - プロフィール画像URL（外部サービス由来）
/// * `bio` - 自己紹介文（任意）
/// * `timezone` - タイムゾーン（任意）
/// * `is_active` - アクティブ状態（必須）
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
/// - **公開設計**: 全フィールドが外部公開想定（内部IDと公開IDの分離不要）
///
/// # 使用例
///
/// ```rust,no_run
/// # use chrono::Utc;
/// # use flequit_model::models::user::User;
/// # use flequit_model::types::id_types::UserId;
///
/// let user = User {
///     id: UserId::new(),
///     username: "john_doe".to_string(),
///     display_name: Some("John Doe".to_string()),
///     email: Some("john@example.com".to_string()),
///     avatar_url: Some("https://example.com/avatar.jpg".to_string()),
///     bio: Some("Software developer".to_string()),
///     timezone: Some("America/New_York".to_string()),
///     is_active: true,
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
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct User {
    /// ユーザーの公開識別子（他者から参照可能、プロジェクト共有用）
    #[partially(omit)] // IDは更新対象外
    pub id: UserId,
    /// ユニークユーザー名（必須、@mention等で使用）
    pub username: String,
    /// 表示用名前（UI表示用、任意設定可能）
    pub display_name: Option<String>,
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
