use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::CommandModelConverter;
use flequit_model::models::accounts::account::Account;
use flequit_model::models::ModelConverter;
use flequit_model::types::id_types::{AccountId, UserId};

/// Tauriコマンド引数用のAccount構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AccountCommandModel {
    /// アカウントID（非公開ID）
    pub id: String,
    /// ユーザーID（公開ID）
    pub user_id: String,
    /// メールアドレス
    pub email: Option<String>,
    /// 表示名
    pub display_name: Option<String>,
    /// アバターURL
    pub avatar_url: Option<String>,
    /// 認証プロバイダー
    pub provider: String,
    /// 認証プロバイダーID
    pub provider_id: Option<String>,
    /// アクティブなプロジェクトか
    pub is_active: bool,
    /// 作成日時
    pub created_at: String,
    /// 更新日時
    pub updated_at: String,
}

#[async_trait]
impl ModelConverter<Account> for AccountCommandModel {
    /// コマンド引数用（AccountCommand）から内部モデル（Account）に変換
    async fn to_model(&self) -> Result<Account, String> {
        use chrono::{DateTime, Utc};

        let created_at = self
            .created_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid created_at format: {}", e))?;
        let updated_at = self
            .updated_at
            .parse::<DateTime<Utc>>()
            .map_err(|e| format!("Invalid updated_at format: {}", e))?;

        Ok(Account {
            id: AccountId::from(
                Uuid::parse_str(&self.id).map_err(|e| format!("Invalid account ID: {}", e))?,
            ),
            user_id: UserId::from(
                Uuid::parse_str(&self.user_id).map_err(|e| format!("Invalid user ID: {}", e))?,
            ),
            email: self.email.clone(),
            display_name: self.display_name.clone(),
            avatar_url: self.avatar_url.clone(),
            provider: self.provider.clone(),
            provider_id: self.provider_id.clone(),
            is_active: self.is_active,
            created_at,
            updated_at,
        })
    }
}

#[async_trait]
impl CommandModelConverter<AccountCommandModel> for Account {
    /// ドメインモデル（Account）からコマンドモデル（AccountCommand）に変換
    async fn to_command_model(&self) -> Result<AccountCommandModel, String> {
        Ok(AccountCommandModel {
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
