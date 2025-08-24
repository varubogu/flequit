//! アカウント管理モデル
//!
//! このモジュールは認証アカウント情報を管理する構造体を定義します。
//!
//! ## 概要
//!
//! `Account`構造体は、外部認証プロバイダー（Google、GitHub等）または
//! ローカル認証によるユーザーアカウント情報を表現します。
//! ユーザー情報とは分離され、認証に特化したデータを管理します。

use super::super::types::id_types::{AccountId, UserId};
use chrono::{DateTime, Utc};
use partially::Partial;
use serde::{Deserialize, Serialize};

use crate::models::{command::account::AccountCommand, CommandModelConverter};

/// 認証アカウント情報を表現する構造体
///
/// 外部認証プロバイダーまたはローカル認証のアカウントデータを管理します。
/// ユーザー固有の情報（名前、プロフィール等）は別途`User`モデルで管理されます。
///
/// # フィールド
///
/// * `id` - アカウントの内部識別子（機密、外部公開禁止）
/// * `user_id` - 公開ユーザー識別子（他者から参照可能、プロジェクト共有用）
/// * `email` - メールアドレス（Optionalで、プロバイダーによっては取得不可）
/// * `display_name` - プロバイダーから提供される表示名
/// * `avatar_url` - プロフィール画像URL（プロバイダー提供）
/// * `provider` - 認証プロバイダー名（"google", "github", "local"等）
/// * `provider_id` - プロバイダー側でのユーザーID（OAuth等で使用）
/// * `is_active` - アカウントの有効性フラグ
/// * `created_at` - アカウント作成日時
/// * `updated_at` - 最終更新日時
///
/// # 設計思想
///
/// - **認証特化**: 認証に必要な情報のみを管理
/// - **プロバイダー対応**: 複数の認証プロバイダーに対応可能な設計
/// - **分離設計**: ユーザー情報と認証情報を明確に分離
/// - **セキュリティ設計**: 内部ID（機密）と公開ID（外部参照用）の二重構造
///
/// # 使用例
///
/// ```rust,no_run
/// # use flequit_lib::models::account::Account;
/// # use flequit_lib::types::id_types::AccountId;
/// # use chrono::Utc;
///
/// // Google認証アカウントの例
/// let google_account = Account {
///     id: AccountId::new(),        // 内部ID（機密）
///     user_id: UserId::new(),      // 公開ID（外部参照用）
///     email: Some("user@gmail.com".to_string()),
///     display_name: Some("John Doe".to_string()),
///     avatar_url: Some("https://lh3.googleusercontent.com/...".to_string()),
///     provider: "google".to_string(),
///     provider_id: Some("google_user_id_456".to_string()),
///     is_active: true,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
/// };
///
/// // ローカル認証アカウントの例
/// let local_account = Account {
///     id: AccountId::new(),        // 内部ID（機密）
///     user_id: UserId::new(),      // 公開ID（外部参照用）
///     email: Some("user@example.com".to_string()),
///     display_name: Some("ローカルユーザー".to_string()),
///     avatar_url: None,
///     provider: "local".to_string(),
///     provider_id: None,
///     is_active: true,
///     created_at: Utc::now(),
///     updated_at: Utc::now(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct Account {
    /// アカウントの内部識別子（機密、外部公開禁止）
    #[partially(omit)] // IDは更新対象外
    pub id: AccountId,
    /// 公開ユーザー識別子（他者から参照可能、プロジェクト共有用）
    #[partially(omit)] // IDは更新対象外
    pub user_id: UserId,
    /// メールアドレス（プロバイダーによっては取得不可）
    pub email: Option<String>,
    /// プロバイダーから提供される表示名
    pub display_name: Option<String>,
    /// プロフィール画像URL（プロバイダー提供）
    pub avatar_url: Option<String>,
    /// 認証プロバイダー名（"google", "github", "local"等）
    pub provider: String,
    /// プロバイダー側でのユーザーID（OAuth等で使用）
    pub provider_id: Option<String>,
    /// アカウントの有効性フラグ
    pub is_active: bool,
    /// アカウント作成日時
    pub created_at: DateTime<Utc>,
    /// 最終更新日時
    pub updated_at: DateTime<Utc>,
}

impl CommandModelConverter<AccountCommand> for Account {
    async fn to_command_model(&self) -> Result<AccountCommand, String> {
        Ok(AccountCommand {
            id: self.id.to_string(),
            user_id: self.user_id.to_string(),
            email: self.email.clone(),
            display_name: self.display_name.clone(),
            avatar_url: self.avatar_url.clone(),
            provider: self.provider.clone(),
            provider_id: self.provider_id.clone(),
            is_active: self.is_active,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        })
    }
}
