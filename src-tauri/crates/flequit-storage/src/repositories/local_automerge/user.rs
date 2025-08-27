use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::repository_error::RepositoryError;
use crate::models::user::User;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::user_repository_trait::UserRepositoryTrait;
use crate::types::id_types::UserId;
use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::Mutex;

/// User用のAutomerge-Repoリポジトリ
#[derive(Debug)]
pub struct UserLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl UserLocalAutomergeRepository {
    /// 新しいUserRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全ユーザーリストを取得
    pub async fn list_users(&self) -> Result<Vec<User>, RepositoryError> {
        let users = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<User>>(&DocumentType::User, "users")
                .await?
        };
        if let Some(users) = users {
            Ok(users)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでユーザーを取得
    pub async fn get_user(&self, user_id: &str) -> Result<Option<User>, RepositoryError> {
        let users = self.list_users().await?;
        Ok(users.into_iter().find(|user| user.id == user_id.into()))
    }

    /// ユーザーを作成または更新
    pub async fn set_user(&self, user: &User) -> Result<(), RepositoryError> {
        let mut users = self.list_users().await?;

        // 既存のユーザーを更新、または新規追加
        if let Some(existing) = users.iter_mut().find(|u| u.id == user.id) {
            *existing = user.clone();
        } else {
            users.push(user.clone());
        }

        {
            let mut manager = self.document_manager.lock().await;
            manager
                .save_data(&DocumentType::User, "users", &users)
                .await
        }
    }

    /// ユーザーを削除
    pub async fn delete_user(&self, user_id: &str) -> Result<bool, RepositoryError> {
        let mut users = self.list_users().await?;
        let initial_len = users.len();
        users.retain(|user| user.id != user_id.into());

        if users.len() != initial_len {
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::User, "users", &users)
                    .await?
            };
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// メールアドレスでユーザーを検索
    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError> {
        let users = self.list_users().await?;
        Ok(users
            .into_iter()
            .find(|user| user.email.as_ref() == Some(&email.to_string())))
    }

    /// ユーザー名でユーザーを検索
    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>, RepositoryError> {
        let users = self.list_users().await?;
        Ok(users.into_iter().find(|user| user.username == username))
    }

    /// ユーザー名でユーザーを検索（部分一致）
    pub async fn find_by_name_partial(&self, name: &str) -> Result<Vec<User>, RepositoryError> {
        let users = self.list_users().await?;
        Ok(users
            .into_iter()
            .filter(|user| user.username.contains(name))
            .collect())
    }

    /// 表示名でユーザーを検索（部分一致）
    pub async fn find_by_display_name_partial(
        &self,
        display_name: &str,
    ) -> Result<Vec<User>, RepositoryError> {
        let users = self.list_users().await?;
        Ok(users
            .into_iter()
            .filter(|user| {
                user.display_name
                    .as_ref()
                    .is_some_and(|dn| dn.contains(display_name))
            })
            .collect())
    }

    /// ユーザーのバックアップを作成
    pub async fn backup_users(&self, backup_path: &str) -> Result<(), RepositoryError> {
        use std::fs;

        // 現在のユーザーデータを取得
        let users = self.list_users().await?;

        // バックアップデータをJSONとして保存
        let backup_content = serde_json::to_string_pretty(&users)
            .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;

        fs::write(backup_path, backup_content)
            .map_err(|e| RepositoryError::IOError(e.to_string()))?;

        Ok(())
    }

    /// バックアップからユーザーを復元
    pub async fn restore_users(&self, backup_path: &str) -> Result<(), RepositoryError> {
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

        let users: Vec<User> = serde_json::from_str(&backup_content)
            .map_err(|e| RepositoryError::SerializationError(e.to_string()))?;

        // 既存のユーザーデータを削除して復元
        {
            let mut manager = self.document_manager.lock().await;
            manager
                .save_data(&DocumentType::User, "users", &users)
                .await?;
        }

        Ok(())
    }

    /// JSON出力機能：ユーザー変更履歴をエクスポート
    #[tracing::instrument(level = "trace", skip(output_dir))]
    pub async fn export_user_changes_history<P: AsRef<Path>>(
        &self,
        output_dir: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        manager
            .export_document_changes_history(&DocumentType::User, &output_dir, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }

    /// JSON出力機能：現在のユーザー状態をファイルにエクスポート
    #[tracing::instrument(level = "trace", skip(file_path))]
    pub async fn export_user_state<P: AsRef<Path>>(
        &self,
        file_path: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        manager
            .export_document_to_file(&DocumentType::User, &file_path, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }
}

// Repository<User, UserId> トレイトの実装
impl UserRepositoryTrait for UserLocalAutomergeRepository {}

#[async_trait]
impl Repository<User, UserId> for UserLocalAutomergeRepository {
    async fn save(&self, entity: &User) -> Result<(), RepositoryError> {
        // 既存のset_userメソッドを活用
        self.set_user(entity).await
    }

    async fn find_by_id(&self, id: &UserId) -> Result<Option<User>, RepositoryError> {
        // 既存のget_userメソッドを活用
        self.get_user(&id.to_string()).await
    }

    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> {
        // 既存のlist_usersメソッドを活用
        self.list_users().await
    }

    async fn delete(&self, id: &UserId) -> Result<(), RepositoryError> {
        // 既存のdelete_userメソッドを活用
        let deleted = self.delete_user(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!("User not found: {}", id)))
        }
    }

    async fn exists(&self, id: &UserId) -> Result<bool, RepositoryError> {
        // find_by_idを使って存在確認
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        // find_allを使って件数取得
        let users = self.find_all().await?;
        Ok(users.len() as u64)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::id_types::UserId;
    use chrono::Utc;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_user_repository() {
        let temp_dir = TempDir::new().unwrap();
        let repo = UserLocalAutomergeRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // 初期状態では空
        let users = repo.list_users().await.unwrap();
        assert_eq!(users.len(), 0);

        // テスト用ユーザーを作成
        let test_user_id = UserId::new();
        let user = User {
            id: test_user_id,
            username: "testuser".to_string(),
            display_name: Some("Test User".to_string()),
            email: Some("test@example.com".to_string()),
            avatar_url: None,
            bio: Some("Test bio".to_string()),
            timezone: Some("UTC".to_string()),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Vec<User>の完全な保存/読み込みテスト
        repo.set_user(&user).await.unwrap();

        // 追加のテストユーザーを作成
        let test_user_id2 = UserId::new();
        let user2 = User {
            id: test_user_id2,
            username: "seconduser".to_string(),
            display_name: Some("Second User".to_string()),
            email: Some("user2@example.com".to_string()),
            avatar_url: Some("https://example.com/avatar2.png".to_string()),
            bio: None,
            timezone: Some("Asia/Tokyo".to_string()),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        repo.set_user(&user2).await.unwrap();

        // ユーザーリストを取得して検証
        let users = repo.list_users().await.unwrap();
        println!("Retrieved {} users", users.len());
        assert_eq!(users.len(), 2);

        // 各ユーザーのデータを検証
        let retrieved1 = repo
            .get_user(&test_user_id.to_string())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(retrieved1.username, "testuser");
        assert_eq!(retrieved1.email, Some("test@example.com".to_string()));
        assert_eq!(retrieved1.display_name, Some("Test User".to_string()));
        assert!(retrieved1.is_active);

        let retrieved2 = repo
            .get_user(&test_user_id2.to_string())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(retrieved2.username, "seconduser");
        assert_eq!(retrieved2.email, Some("user2@example.com".to_string()));
        assert_eq!(retrieved2.display_name, Some("Second User".to_string()));

        // 検索テスト
        let found_by_email = repo.find_by_email("test@example.com").await.unwrap();
        assert!(found_by_email.is_some());
        assert_eq!(found_by_email.unwrap().id, test_user_id);

        let found_by_username = repo.find_by_username("seconduser").await.unwrap();
        assert!(found_by_username.is_some());
        assert_eq!(found_by_username.unwrap().id, test_user_id2);

        let found_by_name_partial = repo.find_by_name_partial("test").await.unwrap();
        assert_eq!(found_by_name_partial.len(), 1);
        assert_eq!(found_by_name_partial[0].id, test_user_id);

        let found_by_display_name_partial =
            repo.find_by_display_name_partial("User").await.unwrap();
        assert_eq!(found_by_display_name_partial.len(), 2);

        // 削除テスト
        let deleted = repo.delete_user(&test_user_id2.to_string()).await.unwrap();
        assert!(deleted);

        let remaining_users = repo.list_users().await.unwrap();
        assert_eq!(remaining_users.len(), 1);
        assert_eq!(remaining_users[0].id, test_user_id);

        println!("Vec<User>の完全な保存/読み込みテストが成功しました！");
    }

    #[tokio::test]
    async fn test_repository_trait_implementation() {
        let temp_dir = TempDir::new().unwrap();
        let repo = UserLocalAutomergeRepository::new(temp_dir.path().to_path_buf()).unwrap();

        // Repository トレイトとして使用
        let repository: &dyn Repository<User, UserId> = &repo;

        // テスト用ユーザー作成
        let test_user_id = UserId::new();
        let user = User {
            id: test_user_id,
            username: "repotestuser".to_string(),
            display_name: Some("Repository Test User".to_string()),
            email: Some("repo_test@example.com".to_string()),
            avatar_url: None,
            bio: None,
            timezone: None,
            is_active: true,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        // Repository トレイトメソッドのテスト
        repository.save(&user).await.unwrap();

        let found = repository.find_by_id(&test_user_id).await.unwrap();
        assert!(found.is_some());
        assert_eq!(
            found.unwrap().email,
            Some("repo_test@example.com".to_string())
        );

        let exists = repository.exists(&test_user_id).await.unwrap();
        assert!(exists);

        let count = repository.count().await.unwrap();
        assert_eq!(count, 1);

        let all_users = repository.find_all().await.unwrap();
        assert_eq!(all_users.len(), 1);

        repository.delete(&test_user_id).await.unwrap();

        let exists_after_delete = repository.exists(&test_user_id).await.unwrap();
        assert!(!exists_after_delete);

        println!("Repository トレイトの実装テストが成功しました！");
    }
}
