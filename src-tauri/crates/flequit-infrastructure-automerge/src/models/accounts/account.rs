use chrono::{DateTime, Utc};
use flequit_model::models::accounts::account::Account;
use flequit_model::types::id_types::{AccountId, UserId};
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};

/// Account用Automergeエンティティ定義
///
/// アカウント管理のAutoMergeデータ構造
/// 分散環境での同期とコンフリクト解決に対応
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct AccountDocument {
    /// アカウントの内部識別子（機密）
    pub id: String,

    /// 公開ユーザー識別子（他者から参照可能、プロジェクト共有用）
    pub user_id: String,

    /// メールアドレス
    pub email: Option<String>,

    /// 表示名
    pub display_name: Option<String>,

    /// アバターURL
    pub avatar_url: Option<String>,

    /// プロバイダー ("local", "github", "google" など)
    pub provider: String,

    /// プロバイダー固有ID
    pub provider_id: Option<String>,

    /// アクティブ状態
    pub is_active: bool,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// 更新日時
    pub updated_at: DateTime<Utc>,
}

impl AccountDocument {
    /// ドメインモデルからAutomergeドキュメントに変換
    pub fn from_domain_model(account: Account) -> Self {
        Self {
            id: account.id.to_string(),
            user_id: account.user_id.to_string(),
            email: account.email,
            display_name: account.display_name,
            avatar_url: account.avatar_url,
            provider: account.provider,
            provider_id: account.provider_id,
            is_active: account.is_active,
            created_at: account.created_at,
            updated_at: account.updated_at,
        }
    }

    /// Automergeドキュメントからドメインモデルに変換
    pub fn to_domain_model(&self) -> Result<Account, RepositoryError> {
        Ok(Account {
            id: AccountId::try_from_str(&self.id).map_err(|e| {
                RepositoryError::from(
                    crate::errors::automerge_error::AutomergeError::ConversionError(e.to_string()),
                )
            })?,
            user_id: UserId::try_from_str(&self.user_id).map_err(|e| {
                RepositoryError::from(
                    crate::errors::automerge_error::AutomergeError::ConversionError(e.to_string()),
                )
            })?,
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
