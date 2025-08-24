use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::account::Account;
use crate::repositories::account_repository_trait::AccountRepositoryTrait;
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::AccountId;
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Account用のAutomerge-Repoリポジトリ
#[derive(Debug)]
pub struct AccountLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl AccountLocalAutomergeRepository {
    /// 新しいAccountRepositoryを作成
    #[tracing::instrument(level = "trace")]
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全アカウントリストを取得
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
    pub async fn get_user(&self, account_id: &str) -> Result<Option<Account>, RepositoryError> {
        let accounts = self.list_users().await?;
        Ok(accounts.into_iter().find(|acc| acc.id == account_id.into()))
    }

    /// アカウントを作成または更新
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
    pub async fn get_current_account_id(&self) -> Result<Option<String>, RepositoryError> {
        {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<String>(&DocumentType::Account, "current_account_id")
                .await
        }
    }

    /// 現在選択中のアカウントIDを設定
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
    pub async fn list_active_accounts(&self) -> Result<Vec<Account>, RepositoryError> {
        let accounts = self.list_users().await?;
        Ok(accounts.into_iter().filter(|acc| acc.is_active).collect())
    }

    /// アカウントのバックアップを作成
    #[tracing::instrument(level = "trace")]
    pub async fn backup_accounts(&self, backup_path: &str) -> Result<(), RepositoryError> {
        use std::fs;

        // 現在のアカウントデータを取得
        let accounts = self.list_users().await?;
        let current_id = self.get_current_account_id().await?;

        // バックアップデータを構造化
        let backup_data = serde_json::json!({
            "accounts": accounts,
            "current_account_id": current_id
        });

        // バックアップファイルに保存
        let backup_content = serde_json::to_string_pretty(&backup_data)
            .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;

        fs::write(backup_path, backup_content)
            .map_err(|e| RepositoryError::IOError(e.to_string()))?;

        Ok(())
    }

    /// バックアップからアカウントを復元
    #[tracing::instrument(level = "trace")]
    pub async fn restore_accounts(&self, backup_path: &str) -> Result<(), RepositoryError> {
        use std::fs;

        // バックアップファイルから読み込み
        if !std::path::Path::new(backup_path).exists() {
            return Err(RepositoryError::NotFound(format!(
                "Backup file not found: {}",
                backup_path
            )));
        }

        let backup_content =
            fs::read_to_string(backup_path).map_err(|e| RepositoryError::IOError(e.to_string()))?;

        let backup_data: serde_json::Value = serde_json::from_str(&backup_content)
            .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;

        // アカウントデータを復元
        if let Some(accounts_value) = backup_data.get("accounts") {
            let accounts: Vec<Account> = serde_json::from_value(accounts_value.clone())
                .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;

            // 既存のアカウントデータを削除して復元
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Account, "accounts", &accounts)
                    .await?;
            }
        }

        // 現在のアカウントIDを復元
        if let Some(current_id_value) = backup_data.get("current_account_id") {
            let current_id: Option<String> = serde_json::from_value(current_id_value.clone())
                .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;

            if let Some(id) = current_id {
                self.set_current_account_id(Some(&id)).await?;
            } else {
                self.set_current_account_id(None).await?;
            }
        }

        Ok(())
    }
}

// Repository<Account, AccountId> トレイトの実装
impl AccountRepositoryTrait for AccountLocalAutomergeRepository {}

#[async_trait]
impl Repository<Account, AccountId> for AccountLocalAutomergeRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, entity: &Account) -> Result<(), RepositoryError> {
        // 既存のset_userメソッドを活用
        self.set_user(entity).await
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, id: &AccountId) -> Result<Option<Account>, RepositoryError> {
        // 既存のget_userメソッドを活用
        self.get_user(&id.to_string()).await
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self) -> Result<Vec<Account>, RepositoryError> {
        // 既存のlist_usersメソッドを活用
        self.list_users().await
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, id: &AccountId) -> Result<(), RepositoryError> {
        // 既存のdelete_accountメソッドを活用
        let deleted = self.delete_account(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "Account not found: {}",
                id
            )))
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, id: &AccountId) -> Result<bool, RepositoryError> {
        // find_by_idを使って存在確認
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self) -> Result<u64, RepositoryError> {
        // find_allを使って件数取得
        let accounts = self.find_all().await?;
        Ok(accounts.len() as u64)
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
        let repo = AccountLocalAutomergeRepository::new(temp_dir.path().to_path_buf()).unwrap();

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

    #[tokio::test]
    async fn test_repository_trait_implementation() {
        let temp_dir = TempDir::new().unwrap();
        let repo = AccountLocalAutomergeRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // Repository トレイトとして使用
        let repository: &dyn Repository<Account, AccountId> = &repo;

        // テスト用アカウント作成
        let test_account_id = AccountId::new();
        let account = Account {
            id: test_account_id,
            email: Some("repo_test@example.com".to_string()),
            display_name: Some("Repository Test User".to_string()),
            avatar_url: None,
            provider: "local".to_string(),
            provider_id: None,
            is_active: true,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        // Repository トレイトメソッドのテスト
        repository.save(&account).await.unwrap();

        let found = repository.find_by_id(&test_account_id).await.unwrap();
        assert!(found.is_some());
        assert_eq!(
            found.unwrap().email,
            Some("repo_test@example.com".to_string())
        );

        let exists = repository.exists(&test_account_id).await.unwrap();
        assert!(exists);

        let count = repository.count().await.unwrap();
        assert_eq!(count, 1);

        let all_accounts = repository.find_all().await.unwrap();
        assert_eq!(all_accounts.len(), 1);

        repository.delete(&test_account_id).await.unwrap();

        let exists_after_delete = repository.exists(&test_account_id).await.unwrap();
        assert!(!exists_after_delete);

        println!("Repository トレイトの実装テストが成功しました！");
    }
}
