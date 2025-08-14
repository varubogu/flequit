// TODO: 実装をautomerge-repoベースに変更する必要があります
// 現在の実装は一時的にコメントアウトしています

use std::path::PathBuf;
use crate::errors::RepositoryError;
use crate::models::account::Account;

/// Account用のAutomerge-Repoリポジトリ
pub struct AccountRepository {
    // TODO: automerge-repo::RepoHandle を使用
    _base_path: PathBuf,
}

impl AccountRepository {
    /// 新しいAccountRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        Ok(Self {
            _base_path: base_path,
        })
    }

    /// 全アカウントリストを取得
    pub fn list_accounts(&mut self) -> Result<Vec<Account>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(Vec::new())
    }

    /// IDでアカウントを取得
    pub fn get_account(&mut self, _account_id: &str) -> Result<Option<Account>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// アカウントを作成または更新
    pub fn save_account(&mut self, _account: &Account) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// アカウントを削除
    pub fn delete_account(&mut self, _account_id: &str) -> Result<bool, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(false)
    }

    /// 現在選択中のアカウントIDを取得
    pub fn get_current_account_id(&mut self) -> Result<Option<String>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// 現在選択中のアカウントIDを設定
    pub fn set_current_account_id(&mut self, _account_id: Option<&str>) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// 現在選択中のアカウントを取得
    pub fn get_current_account(&mut self) -> Result<Option<Account>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(None)
    }

    /// プロバイダーで検索
    pub fn find_accounts_by_provider(&mut self, _provider: &str) -> Result<Vec<Account>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(Vec::new())
    }

    /// アクティブなアカウントのみを取得
    pub fn list_active_accounts(&mut self) -> Result<Vec<Account>, RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(Vec::new())
    }

    /// アカウントのバックアップを作成
    pub fn backup_accounts(&self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
        Ok(())
    }

    /// バックアップからアカウントを復元
    pub fn restore_accounts(&mut self, _backup_path: &str) -> Result<(), RepositoryError> {
        // TODO: automerge-repoを使用した実装
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
        let accounts = repo.list_accounts().unwrap();
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

        // 保存 (現在は何もしない)
        repo.save_account(&account).unwrap();

        // TODO: 実装完了後にテストを有効化
        // let retrieved = repo.get_account("acc_test_123").unwrap().unwrap();
        // assert_eq!(retrieved.email, Some("test@example.com".to_string()));
    }
}