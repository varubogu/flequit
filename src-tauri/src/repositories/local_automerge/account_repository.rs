use std::path::PathBuf;
use crate::errors::RepositoryError;
use crate::models::account::Account;
use super::document_manager::{DocumentManager, DocumentType};

/// Account用のAutomerge-Repoリポジトリ
pub struct AccountRepository {
    document_manager: DocumentManager,
}

impl AccountRepository {
    /// 新しいAccountRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager,
        })
    }

    /// 全アカウントリストを取得
    pub async fn list_accounts(&mut self) -> Result<Vec<Account>, RepositoryError> {
        if let Some(accounts) = self.document_manager
            .load_data::<Vec<Account>>(&DocumentType::Account, "accounts").await? {
            Ok(accounts)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでアカウントを取得
    pub async fn get_account(&mut self, account_id: &str) -> Result<Option<Account>, RepositoryError> {
        let accounts = self.list_accounts().await?;
        Ok(accounts.into_iter().find(|acc| acc.id == account_id))
    }

    /// アカウントを作成または更新
    pub async fn save_account(&mut self, account: &Account) -> Result<(), RepositoryError> {
        let mut accounts = self.list_accounts().await?;
        
        // 既存のアカウントを更新、または新規追加
        if let Some(existing) = accounts.iter_mut().find(|acc| acc.id == account.id) {
            *existing = account.clone();
        } else {
            accounts.push(account.clone());
        }
        
        self.document_manager
            .save_data(&DocumentType::Account, "accounts", &accounts).await
    }

    /// アカウントを削除
    pub async fn delete_account(&mut self, account_id: &str) -> Result<bool, RepositoryError> {
        let mut accounts = self.list_accounts().await?;
        let initial_len = accounts.len();
        accounts.retain(|acc| acc.id != account_id);
        
        if accounts.len() != initial_len {
            self.document_manager
                .save_data(&DocumentType::Account, "accounts", &accounts).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// 現在選択中のアカウントIDを取得
    pub async fn get_current_account_id(&mut self) -> Result<Option<String>, RepositoryError> {
        self.document_manager
            .load_data::<String>(&DocumentType::Account, "current_account_id").await
    }

    /// 現在選択中のアカウントIDを設定
    pub async fn set_current_account_id(&mut self, account_id: Option<&str>) -> Result<(), RepositoryError> {
        if let Some(id) = account_id {
            self.document_manager
                .save_data(&DocumentType::Account, "current_account_id", &id.to_string()).await
        } else {
            // Nullの場合は空文字列で代替（将来的に改善）
            self.document_manager
                .save_data(&DocumentType::Account, "current_account_id", &String::new()).await
        }
    }

    /// 現在選択中のアカウントを取得
    pub async fn get_current_account(&mut self) -> Result<Option<Account>, RepositoryError> {
        if let Some(current_id) = self.get_current_account_id().await? {
            if !current_id.is_empty() {
                self.get_account(&current_id).await
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// プロバイダーで検索
    pub async fn find_accounts_by_provider(&mut self, provider: &str) -> Result<Vec<Account>, RepositoryError> {
        let accounts = self.list_accounts().await?;
        Ok(accounts.into_iter()
            .filter(|acc| acc.provider == provider)
            .collect())
    }

    /// アクティブなアカウントのみを取得
    pub async fn list_active_accounts(&mut self) -> Result<Vec<Account>, RepositoryError> {
        let accounts = self.list_accounts().await?;
        Ok(accounts.into_iter()
            .filter(|acc| acc.is_active)
            .collect())
    }

    /// アカウントのバックアップを作成
    pub fn backup_accounts(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: アカウントドキュメントファイルをバックアップパスにコピー
        Ok(())
    }

    /// バックアップからアカウントを復元
    pub async fn restore_accounts(&mut self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: バックアップファイルからドキュメントを復元
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use chrono::Utc;

    #[tokio::test]
    async fn test_account_repository() {
        let temp_dir = TempDir::new().unwrap();
        let mut repo = AccountRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // 初期状態では空
        let accounts = repo.list_accounts().await.unwrap();
        assert_eq!(accounts.len(), 0);

        // テスト用アカウントを作成
        let account = Account {
            id: "acc_test_123".to_string(),
            email: Some("test@example.com".to_string()),
            display_name: Some("Test User".to_string()),
            avatar_url: None,
            provider: "local".to_string(),
            provider_id: None,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // アカウントを保存（現在はシンプルな実装）
        repo.save_account(&account).await.unwrap();
        
        // 基本的な機能のテスト
        let current_id = repo.get_current_account_id().await.unwrap();
        println!("Current account ID: {:?}", current_id);
        
        // 現在のアカウントIDを設定テスト
        repo.set_current_account_id(Some("acc_test_123")).await.unwrap();
        let updated_current_id = repo.get_current_account_id().await.unwrap();
        assert_eq!(updated_current_id, Some("acc_test_123".to_string()));
        
        println!("アカウントリポジトリの基本機能テストが完了しました。");
        println!("Note: 複雑なオブジェクトのシリアライゼーションは次のフェーズで実装予定です。");
    }
}