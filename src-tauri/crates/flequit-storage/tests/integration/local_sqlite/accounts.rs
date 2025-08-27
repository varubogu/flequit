//! アカウント単体テスト
//!
//! testing.mdルール準拠のSQLiteアカウントリポジトリテスト

use crate::models::account::Account;
use crate::types::id_types::{AccountId, UserId};
use crate::repositories::local_sqlite::account::AccountLocalSqliteRepository;
use crate::repositories::base_repository_trait::Repository;
use uuid::Uuid;
use std::sync::Arc;

use crate::setup_sqlite_test;

#[tokio::test]
async fn test_account_create_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_account_create_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let account_repo = AccountLocalSqliteRepository::new(db_manager_arc);
    
    // テストデータ作成
    let account_id = AccountId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let account = Account {
        id: account_id.clone(),
        user_id: user_id.clone(),
        email: Some("test@example.com".to_string()),
        display_name: Some("テストユーザー".to_string()),
        avatar_url: Some("https://example.com/avatar.jpg".to_string()),
        provider: "google".to_string(),
        provider_id: Some("google_123456789".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // Create操作（saveメソッドを使用）
    account_repo.save(&account).await?;
    
    // 作成確認
    let retrieved_account = account_repo.find_by_id(&account_id).await?;
    assert!(retrieved_account.is_some());
    let retrieved_account = retrieved_account.unwrap();
    assert_eq!(retrieved_account.id, account.id);
    assert_eq!(retrieved_account.user_id, account.user_id);
    assert_eq!(retrieved_account.email, account.email);
    assert_eq!(retrieved_account.display_name, account.display_name);
    assert_eq!(retrieved_account.provider, account.provider);
    assert_eq!(retrieved_account.is_active, account.is_active);
    
    Ok(())
}

#[tokio::test]
async fn test_account_read_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_account_read_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let account_repo = AccountLocalSqliteRepository::new(db_manager_arc);
    
    // 2件のテストデータを作成
    let account_id1 = AccountId::from(Uuid::new_v4());
    let user_id1 = UserId::from(Uuid::new_v4());
    let account1 = Account {
        id: account_id1.clone(),
        user_id: user_id1.clone(),
        email: Some("read1@example.com".to_string()),
        display_name: Some("Read操作テストユーザー1".to_string()),
        avatar_url: Some("https://example.com/read1.jpg".to_string()),
        provider: "github".to_string(),
        provider_id: Some("github_111".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let account_id2 = AccountId::from(Uuid::new_v4());
    let user_id2 = UserId::from(Uuid::new_v4());
    let account2 = Account {
        id: account_id2.clone(),
        user_id: user_id2.clone(),
        email: Some("read2@example.com".to_string()),
        display_name: Some("Read操作テストユーザー2".to_string()),
        avatar_url: None,
        provider: "local".to_string(),
        provider_id: None,
        is_active: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    account_repo.save(&account1).await?;
    account_repo.save(&account2).await?;
    
    // 1件目のみRead操作
    let retrieved_account = account_repo.find_by_id(&account_id1).await?;
    assert!(retrieved_account.is_some());
    let retrieved_account = retrieved_account.unwrap();
    assert_eq!(retrieved_account.id, account1.id);
    assert_eq!(retrieved_account.user_id, account1.user_id);
    assert_eq!(retrieved_account.email, account1.email);
    assert_eq!(retrieved_account.provider, account1.provider);
    assert_eq!(retrieved_account.provider_id, account1.provider_id);
    
    // 2件目が存在することも確認
    let retrieved_account2 = account_repo.find_by_id(&account_id2).await?;
    assert!(retrieved_account2.is_some());
    
    Ok(())
}

#[tokio::test]
async fn test_account_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_account_update_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let account_repo = AccountLocalSqliteRepository::new(db_manager_arc);
    
    // 2件のテストデータを作成
    let account_id1 = AccountId::from(Uuid::new_v4());
    let user_id1 = UserId::from(Uuid::new_v4());
    let account1 = Account {
        id: account_id1.clone(),
        user_id: user_id1.clone(),
        email: Some("update1@example.com".to_string()),
        display_name: Some("Update操作テストユーザー1".to_string()),
        avatar_url: Some("https://example.com/update1.jpg".to_string()),
        provider: "google".to_string(),
        provider_id: Some("google_update1".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let account_id2 = AccountId::from(Uuid::new_v4());
    let user_id2 = UserId::from(Uuid::new_v4());
    let account2 = Account {
        id: account_id2.clone(),
        user_id: user_id2.clone(),
        email: Some("update2@example.com".to_string()),
        display_name: Some("Update操作テストユーザー2".to_string()),
        avatar_url: None,
        provider: "github".to_string(),
        provider_id: Some("github_update2".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    account_repo.save(&account1).await?;
    account_repo.save(&account2).await?;
    
    // 1件目のUpdate操作 - 基本的なフィールドをテスト
    let mut updated_account = account1.clone();
    updated_account.is_active = false; // is_activeフィールドの更新をテスト
    updated_account.updated_at = chrono::Utc::now();
    account_repo.save(&updated_account).await?;
    
    // 更新後の取得確認（1件目）- is_activeフィールドが更新されたことを確認
    let retrieved_updated = account_repo.find_by_id(&account_id1).await?;
    assert!(retrieved_updated.is_some());
    let retrieved_updated = retrieved_updated.unwrap();
    assert_eq!(retrieved_updated.is_active, updated_account.is_active);
    // Account IDとuser_idは変更されないことを確認
    assert_eq!(retrieved_updated.id, account1.id);
    assert_eq!(retrieved_updated.user_id, account1.user_id);
    
    // 2件目が変更されていないことを確認
    let retrieved_account2 = account_repo.find_by_id(&account_id2).await?;
    assert!(retrieved_account2.is_some());
    let retrieved_account2 = retrieved_account2.unwrap();
    assert_eq!(retrieved_account2.email, account2.email);
    assert_eq!(retrieved_account2.display_name, account2.display_name);
    assert_eq!(retrieved_account2.is_active, account2.is_active);
    
    Ok(())
}

#[tokio::test]
async fn test_account_delete_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_account_delete_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let account_repo = AccountLocalSqliteRepository::new(db_manager_arc);
    
    // 2件のテストデータを作成
    let account_id1 = AccountId::from(Uuid::new_v4());
    let user_id1 = UserId::from(Uuid::new_v4());
    let account1 = Account {
        id: account_id1.clone(),
        user_id: user_id1.clone(),
        email: Some("delete1@example.com".to_string()),
        display_name: Some("Delete操作テストユーザー1".to_string()),
        avatar_url: Some("https://example.com/delete1.jpg".to_string()),
        provider: "google".to_string(),
        provider_id: Some("google_delete1".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let account_id2 = AccountId::from(Uuid::new_v4());
    let user_id2 = UserId::from(Uuid::new_v4());
    let account2 = Account {
        id: account_id2.clone(),
        user_id: user_id2.clone(),
        email: Some("delete2@example.com".to_string()),
        display_name: Some("Delete操作テストユーザー2".to_string()),
        avatar_url: None,
        provider: "local".to_string(),
        provider_id: None,
        is_active: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    account_repo.save(&account1).await?;
    account_repo.save(&account2).await?;
    
    // 1件目のみDelete操作
    account_repo.delete(&account_id1).await?;
    
    // 削除確認（1件目）
    let deleted_check = account_repo.find_by_id(&account_id1).await?;
    assert!(deleted_check.is_none());
    
    // 2件目が削除されていないことを確認
    let retrieved_account2 = account_repo.find_by_id(&account_id2).await?;
    assert!(retrieved_account2.is_some());
    let retrieved_account2 = retrieved_account2.unwrap();
    assert_eq!(retrieved_account2.email, account2.email);
    
    Ok(())
}

#[tokio::test]
async fn test_account_provider_specific_operations() -> Result<(), Box<dyn std::error::Error>> {
    // プロバイダー固有のテスト（Google、GitHub、ローカル認証）
    let db_path = setup_sqlite_test!("test_account_provider_operations")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let account_repo = AccountLocalSqliteRepository::new(db_manager_arc);
    
    // Google認証アカウント
    let google_account_id = AccountId::from(Uuid::new_v4());
    let google_user_id = UserId::from(Uuid::new_v4());
    let google_account = Account {
        id: google_account_id.clone(),
        user_id: google_user_id.clone(),
        email: Some("user@gmail.com".to_string()),
        display_name: Some("Google User".to_string()),
        avatar_url: Some("https://lh3.googleusercontent.com/abc123".to_string()),
        provider: "google".to_string(),
        provider_id: Some("google_123456789".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // GitHub認証アカウント
    let github_account_id = AccountId::from(Uuid::new_v4());
    let github_user_id = UserId::from(Uuid::new_v4());
    let github_account = Account {
        id: github_account_id.clone(),
        user_id: github_user_id.clone(),
        email: Some("user@github.example.com".to_string()),
        display_name: Some("GitHub User".to_string()),
        avatar_url: Some("https://avatars.githubusercontent.com/u/123456".to_string()),
        provider: "github".to_string(),
        provider_id: Some("github_123456".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // ローカル認証アカウント
    let local_account_id = AccountId::from(Uuid::new_v4());
    let local_user_id = UserId::from(Uuid::new_v4());
    let local_account = Account {
        id: local_account_id.clone(),
        user_id: local_user_id.clone(),
        email: Some("local@example.com".to_string()),
        display_name: Some("Local User".to_string()),
        avatar_url: None,
        provider: "local".to_string(),
        provider_id: None,
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 全て保存
    account_repo.save(&google_account).await?;
    account_repo.save(&github_account).await?;
    account_repo.save(&local_account).await?;
    
    // 各プロバイダーアカウントの取得確認
    let retrieved_google = account_repo.find_by_id(&google_account_id).await?;
    assert!(retrieved_google.is_some());
    let retrieved_google = retrieved_google.unwrap();
    assert_eq!(retrieved_google.provider, "google");
    assert!(retrieved_google.provider_id.is_some());
    assert!(retrieved_google.avatar_url.is_some());
    
    let retrieved_github = account_repo.find_by_id(&github_account_id).await?;
    assert!(retrieved_github.is_some());
    let retrieved_github = retrieved_github.unwrap();
    assert_eq!(retrieved_github.provider, "github");
    assert!(retrieved_github.provider_id.is_some());
    assert!(retrieved_github.avatar_url.is_some());
    
    let retrieved_local = account_repo.find_by_id(&local_account_id).await?;
    assert!(retrieved_local.is_some());
    let retrieved_local = retrieved_local.unwrap();
    assert_eq!(retrieved_local.provider, "local");
    assert!(retrieved_local.provider_id.is_none());
    assert!(retrieved_local.avatar_url.is_none());
    
    Ok(())
}

#[tokio::test]
async fn test_repository_isolation() -> Result<(), Box<dyn std::error::Error>> {
    // 複数のテストが独立していることを確認
    let db_path1 = setup_sqlite_test!("test_account_repository_isolation_1")?;
    let db_path2 = setup_sqlite_test!("test_account_repository_isolation_2")?;
    
    // 異なるデータベースパスを使用していることを確認
    assert_ne!(db_path1, db_path2);
    
    // それぞれのデータベースが独立して動作することを確認
    let db_manager1 = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path1.to_string_lossy().to_string());
    let db_manager2 = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path2.to_string_lossy().to_string());
    
    let account_repo1 = AccountLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager1)));
    let account_repo2 = AccountLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager2)));
    
    // DB1にアカウント作成
    let account_id1 = AccountId::from(Uuid::new_v4());
    let user_id1 = UserId::from(Uuid::new_v4());
    let account1 = Account {
        id: account_id1.clone(),
        user_id: user_id1.clone(),
        email: Some("db1@example.com".to_string()),
        display_name: Some("DB1ユーザー".to_string()),
        avatar_url: None,
        provider: "local".to_string(),
        provider_id: None,
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    account_repo1.save(&account1).await?;
    
    // DB2からは見えないことを確認
    let not_found = account_repo2.find_by_id(&account_id1).await?;
    assert!(not_found.is_none());
    
    // DB2にも別のアカウント作成
    let account_id2 = AccountId::from(Uuid::new_v4());
    let user_id2 = UserId::from(Uuid::new_v4());
    let account2 = Account {
        id: account_id2.clone(),
        user_id: user_id2.clone(),
        email: Some("db2@example.com".to_string()),
        display_name: Some("DB2ユーザー".to_string()),
        avatar_url: None,
        provider: "google".to_string(),
        provider_id: Some("google_db2".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    account_repo2.save(&account2).await?;
    
    // DB1からは見えないことを確認
    let not_found = account_repo1.find_by_id(&account_id2).await?;
    assert!(not_found.is_none());
    
    println!("✅ テストデータベース分離確認完了");
    
    Ok(())
}