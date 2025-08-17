use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::account::Account;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Account用のAutomerge-Repoリポジトリ
pub struct LocalAutomergeAccountRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl LocalAutomergeAccountRepository {
    /// 新しいAccountRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全アカウントリストを取得
    pub async fn list_users(&self) -> Result<Vec<Account>, RepositoryError> {
        let accounts = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<Account>>(&DocumentType::Account, "accounts")
                .await?
        };
        if let Some(accounts) = accounts {
            Ok(accounts)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでアカウントを取得
    pub async fn get_user(&self, account_id: &str) -> Result<Option<Account>, RepositoryError> {
        let accounts = self.list_users().await?;
        Ok(accounts.into_iter().find(|acc| acc.id == account_id.into()))
    }

    /// アカウントを作成または更新
    pub async fn set_user(&self, account: &Account) -> Result<(), RepositoryError> {
        let mut accounts = self.list_users().await?;

        // 既存のアカウントを更新、または新規追加
        if let Some(existing) = accounts.iter_mut().find(|acc| acc.id == account.id) {
            *existing = account.clone();
        } else {
            accounts.push(account.clone());
        }

        {
            let mut manager = self.document_manager.lock().await;
            manager
                .save_data(&DocumentType::Account, "accounts", &accounts)
                .await
        }
    }

    /// アカウントを削除
    pub async fn delete_account(&self, account_id: &str) -> Result<bool, RepositoryError> {
        let mut accounts = self.list_users().await?;
        let initial_len = accounts.len();
        accounts.retain(|acc| acc.id != account_id.into());

        if accounts.len() != initial_len {
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Account, "accounts", &accounts)
                    .await?
            };
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// 現在選択中のアカウントIDを取得
    pub async fn get_current_account_id(&self) -> Result<Option<String>, RepositoryError> {
        {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<String>(&DocumentType::Account, "current_account_id")
                .await
        }
    }

    /// 現在選択中のアカウントIDを設定
    pub async fn set_current_account_id(
        &self,
        account_id: Option<&str>,
    ) -> Result<(), RepositoryError> {
        if let Some(id) = account_id {
            let id_string = id.to_string();
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Account, "current_account_id", &id_string)
                    .await
            }
        } else {
            // Nullの場合は空文字列で代替（将来的に改善）
            let empty_string = String::new();
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Account, "current_account_id", &empty_string)
                    .await
            }
        }
    }

    /// 現在選択中のアカウントを取得
    pub async fn get_current_account(&self) -> Result<Option<Account>, RepositoryError> {
        if let Some(current_id) = self.get_current_account_id().await? {
            if !current_id.is_empty() {
                self.get_user(&current_id).await
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// プロバイダーで検索
    pub async fn find_accounts_by_provider(
        &self,
        provider: &str,
    ) -> Result<Vec<Account>, RepositoryError> {
        let accounts = self.list_users().await?;
        Ok(accounts
            .into_iter()
            .filter(|acc| acc.provider == provider)
            .collect())
    }

    /// アクティブなアカウントのみを取得
    pub async fn list_active_accounts(&self) -> Result<Vec<Account>, RepositoryError> {
        let accounts = self.list_users().await?;
        Ok(accounts.into_iter().filter(|acc| acc.is_active).collect())
    }

    /// アカウントのバックアップを作成
    pub fn backup_accounts(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: アカウントドキュメントファイルをバックアップパスにコピー
        Ok(())
    }

    /// バックアップからアカウントを復元
    pub async fn restore_accounts(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: バックアップファイルからドキュメントを復元
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::types::id_types::AccountId;

    use super::*;
    use chrono::Utc;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_account_repository() {
        let temp_dir = TempDir::new().unwrap();
        let repo = LocalAutomergeAccountRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // 初期状態では空
        let accounts = repo.list_users().await.unwrap();
        assert_eq!(accounts.len(), 0);

        // テスト用アカウントを作成
        let test_account_id = AccountId::new();
        let account = Account {
            id: test_account_id,
            email: Some("test@example.com".to_string()),
            display_name: Some("Test User".to_string()),
            avatar_url: None,
            provider: "local".to_string(),
            provider_id: None,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Vec<Account>の完全な保存/読み込みテスト（改良後）
        repo.set_user(&account).await.unwrap();

        // 追加のテストアカウントを作成
        let test_account_id2 = AccountId::new();
        let account2 = Account {
            id: test_account_id2,
            email: Some("user2@example.com".to_string()),
            display_name: Some("Second User".to_string()),
            avatar_url: Some("https://example.com/avatar2.png".to_string()),
            provider: "github".to_string(),
            provider_id: Some("github_123".to_string()),
            is_active: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        repo.set_user(&account2).await.unwrap();

        // アカウントリストを取得して検証
        let accounts = repo.list_users().await.unwrap();
        println!("Retrieved {} accounts", accounts.len());
        assert_eq!(accounts.len(), 2);

        // 各アカウントのデータを検証
        let retrieved1 = repo
            .get_user(&test_account_id.to_string())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(retrieved1.email, Some("test@example.com".to_string()));
        assert_eq!(retrieved1.display_name, Some("Test User".to_string()));
        assert_eq!(retrieved1.provider, "local");
        assert_eq!(retrieved1.is_active, true);

        let retrieved2 = repo
            .get_user(&test_account_id2.to_string())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(retrieved2.email, Some("user2@example.com".to_string()));
        assert_eq!(retrieved2.provider, "github");
        assert_eq!(retrieved2.is_active, false);

        // フィルタリングテスト
        let active_accounts = repo.list_active_accounts().await.unwrap();
        assert_eq!(active_accounts.len(), 1);
        assert_eq!(active_accounts[0].id, test_account_id);

        let local_accounts = repo.find_accounts_by_provider("local").await.unwrap();
        assert_eq!(local_accounts.len(), 1);

        let github_accounts = repo.find_accounts_by_provider("github").await.unwrap();
        assert_eq!(github_accounts.len(), 1);

        // 現在のアカウント管理テスト
        repo.set_current_account_id(Some(&test_account_id.to_string()))
            .await
            .unwrap();
        let current_account = repo.get_current_account().await.unwrap().unwrap();
        assert_eq!(current_account.id, test_account_id);

        // 削除テスト
        let deleted = repo
            .delete_account(&test_account_id2.to_string())
            .await
            .unwrap();
        assert!(deleted);

        let remaining_accounts = repo.list_users().await.unwrap();
        assert_eq!(remaining_accounts.len(), 1);
        assert_eq!(remaining_accounts[0].id, test_account_id);

        println!("Vec<Account>の完全な保存/読み込みテストが成功しました！");
    }
}
