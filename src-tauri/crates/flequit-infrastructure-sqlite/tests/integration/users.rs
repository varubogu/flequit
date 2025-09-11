//! ユーザー単体テスト
//!
//! testing.mdルール準拠のSQLiteユーザーリポジトリテスト

use flequit_model::models::users::user::User;
use flequit_model::types::id_types::UserId;
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::users::user::UserLocalSqliteRepository;
use flequit_repository::repositories::base_repository_trait::Repository;
use uuid::Uuid;
use std::sync::Arc;

use flequit_testing::TestPathGenerator;

use crate::integration::support::sqlite::SqliteTestHarness;

#[tokio::test]
async fn test_user_create_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = TestPathGenerator::generate_test_dir(file!(), "test_user_create_operation");
    std::fs::create_dir_all(&db_path)?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let user_repo = UserLocalSqliteRepository::new(db_manager_arc);

    // テストデータ作成
    let user_id = UserId::from(Uuid::new_v4());
    let user = User {
        id: user_id.clone(),
        handle_id: "test_user1".to_string(),
        display_name: "テストユーザー1".to_string(),
        email: Some("test1@example.com".to_string()),
        avatar_url: Some("https://example.com/avatar1.jpg".to_string()),
        bio: Some("Create操作のためのテストユーザーです".to_string()),
        timezone: Some("Asia/Tokyo".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // Create操作（saveメソッドを使用）
    user_repo.save(&user).await?;

    // 作成確認
    let retrieved_user = user_repo.find_by_id(&user_id).await?;
    assert!(retrieved_user.is_some());
    let retrieved_user = retrieved_user.unwrap();
    assert_eq!(retrieved_user.id, user.id);
    assert_eq!(retrieved_user.handle_id, user.handle_id);
    assert_eq!(retrieved_user.display_name, user.display_name);
    assert_eq!(retrieved_user.email, user.email);
    assert_eq!(retrieved_user.is_active, user.is_active);

    Ok(())
}

#[tokio::test]
async fn test_user_read_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = TestPathGenerator::generate_test_dir(file!(), "test_user_read_operation");
    std::fs::create_dir_all(&db_path)?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let user_repo = UserLocalSqliteRepository::new(db_manager_arc);

    // 2件のテストデータを作成
    let user_id1 = UserId::from(Uuid::new_v4());
    let user1 = User {
        id: user_id1.clone(),
        handle_id: "read_test_user1".to_string(),
        display_name: "Read操作テストユーザー1".to_string(),
        email: Some("readtest1@example.com".to_string()),
        avatar_url: Some("https://example.com/read1.jpg".to_string()),
        bio: Some("Read操作のためのテストユーザー1".to_string()),
        timezone: Some("America/New_York".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let user_id2 = UserId::from(Uuid::new_v4());
    let user2 = User {
        id: user_id2.clone(),
        handle_id: "read_test_user2".to_string(),
        display_name: "Read操作テストユーザー2".to_string(),
        email: Some("readtest2@example.com".to_string()),
        avatar_url: None,
        bio: None,
        timezone: Some("Europe/London".to_string()),
        is_active: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // 2件とも保存
    user_repo.save(&user1).await?;
    user_repo.save(&user2).await?;

    // 1件目のみRead操作
    let retrieved_user = user_repo.find_by_id(&user_id1).await?;
    assert!(retrieved_user.is_some());
    let retrieved_user = retrieved_user.unwrap();
    assert_eq!(retrieved_user.id, user1.id);
    assert_eq!(retrieved_user.handle_id, user1.handle_id);
    assert_eq!(retrieved_user.display_name, user1.display_name);
    assert_eq!(retrieved_user.email, user1.email);

    // 2件目が存在することも確認
    let retrieved_user2 = user_repo.find_by_id(&user_id2).await?;
    assert!(retrieved_user2.is_some());

    Ok(())
}

#[tokio::test]
async fn test_user_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = "test_user_update_operation";
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let user_repo = UserLocalSqliteRepository::new(db_manager_arc);

    // 2件のテストデータを作成
    let user_id1 = UserId::from(Uuid::new_v4());
    let user1 = User {
        id: user_id1.clone(),
        handle_id: "update_test_user1".to_string(),
        display_name: "Update操作テストユーザー1".to_string(),
        email: Some("updatetest1@example.com".to_string()),
        avatar_url: Some("https://example.com/update1.jpg".to_string()),
        bio: Some("Update操作のためのテストユーザー1".to_string()),
        timezone: Some("Asia/Tokyo".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let user_id2 = UserId::from(Uuid::new_v4());
    let user2 = User {
        id: user_id2.clone(),
        handle_id: "update_test_user2".to_string(),
        display_name: "Update操作テストユーザー2".to_string(),
        email: Some("updatetest2@example.com".to_string()),
        avatar_url: None,
        bio: None,
        timezone: Some("UTC".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // 2件とも保存
    user_repo.save(&user1).await?;
    user_repo.save(&user2).await?;

    // 1件目のみUpdate操作
    let mut updated_user = user1.clone();
    updated_user.handle_id = "updated_user1".to_string();
    updated_user.display_name = "更新されたユーザー1".to_string();
    updated_user.email = Some("updated1@example.com".to_string());
    updated_user.bio = Some("更新されたユーザーの説明".to_string());
    updated_user.is_active = false;
    updated_user.updated_at = chrono::Utc::now();
    user_repo.save(&updated_user).await?;

    // 更新後の取得確認（1件目）
    let retrieved_updated = user_repo.find_by_id(&user_id1).await?;
    assert!(retrieved_updated.is_some());
    let retrieved_updated = retrieved_updated.unwrap();
    assert_eq!(retrieved_updated.handle_id, updated_user.handle_id);
    assert_eq!(retrieved_updated.display_name, updated_user.display_name);
    assert_eq!(retrieved_updated.email, updated_user.email);
    assert_eq!(retrieved_updated.bio, updated_user.bio);
    assert_eq!(retrieved_updated.is_active, updated_user.is_active);

    // 2件目が変更されていないことを確認
    let retrieved_user2 = user_repo.find_by_id(&user_id2).await?;
    assert!(retrieved_user2.is_some());
    let retrieved_user2 = retrieved_user2.unwrap();
    assert_eq!(retrieved_user2.handle_id, user2.handle_id);
    assert_eq!(retrieved_user2.display_name, user2.display_name);
    assert_eq!(retrieved_user2.is_active, user2.is_active);

    Ok(())
}

#[tokio::test]
async fn test_user_delete_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = TestPathGenerator::generate_test_dir(file!(), "test_user_delete_operation");
    std::fs::create_dir_all(&db_path)?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let user_repo = UserLocalSqliteRepository::new(db_manager_arc);

    // 2件のテストデータを作成
    let user_id1 = UserId::from(Uuid::new_v4());
    let user1 = User {
        id: user_id1.clone(),
        handle_id: "delete_test_user1".to_string(),
        display_name:"Delete操作テストユーザー1".to_string(),
        email: Some("deletetest1@example.com".to_string()),
        avatar_url: Some("https://example.com/delete1.jpg".to_string()),
        bio: Some("Delete操作のためのテストユーザー1".to_string()),
        timezone: Some("Asia/Tokyo".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let user_id2 = UserId::from(Uuid::new_v4());
    let user2 = User {
        id: user_id2.clone(),
        handle_id: "delete_test_user2".to_string(),
        display_name: "Delete操作テストユーザー2".to_string(),
        email: Some("deletetest2@example.com".to_string()),
        avatar_url: None,
        bio: None,
        timezone: Some("UTC".to_string()),
        is_active: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // 2件とも保存
    user_repo.save(&user1).await?;
    user_repo.save(&user2).await?;

    // 1件目のみDelete操作
    user_repo.delete(&user_id1).await?;

    // 削除確認（1件目）
    let deleted_check = user_repo.find_by_id(&user_id1).await?;
    assert!(deleted_check.is_none());

    // 2件目が削除されていないことを確認
    let retrieved_user2 = user_repo.find_by_id(&user_id2).await?;
    assert!(retrieved_user2.is_some());
    let retrieved_user2 = retrieved_user2.unwrap();
    assert_eq!(retrieved_user2.handle_id, user2.handle_id);

    Ok(())
}

#[tokio::test]
async fn test_repository_isolation() -> Result<(), Box<dyn std::error::Error>> {
    // 複数のテストが独立していることを確認
    let db_path1 = TestPathGenerator::generate_test_dir(file!(), "test_user_repository_isolation_1");
    let db_path2 = TestPathGenerator::generate_test_dir(file!(), "test_user_repository_isolation_2");
    std::fs::create_dir_all(&db_path1)?;
    std::fs::create_dir_all(&db_path2)?;

    // 異なるデータベースパスを使用していることを確認
    assert_ne!(db_path1, db_path2);

    // それぞれのデータベースが独立して動作することを確認
    let db_manager1 = DatabaseManager::new_for_test(db_path1.to_string_lossy().to_string());
    let db_manager2 = DatabaseManager::new_for_test(db_path2.to_string_lossy().to_string());

    let user_repo1 = UserLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager1)));
    let user_repo2 = UserLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager2)));

    // DB1にユーザー作成
    let user_id1 = UserId::from(Uuid::new_v4());
    let user1 = User {
        id: user_id1.clone(),
        handle_id: "db1_user".to_string(),
        display_name: "DB1ユーザー".to_string(),
        email: Some("db1@example.com".to_string()),
        avatar_url: None,
        bio: None,
        timezone: Some("Asia/Tokyo".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    user_repo1.save(&user1).await?;

    // DB2からは見えないことを確認
    let not_found = user_repo2.find_by_id(&user_id1).await?;
    assert!(not_found.is_none());

    // DB2にも別のユーザー作成
    let user_id2 = UserId::from(Uuid::new_v4());
    let user2 = User {
        id: user_id2.clone(),
        handle_id: "db2_user".to_string(),
        display_name: "DB2ユーザー".to_string(),
        email: Some("db2@example.com".to_string()),
        avatar_url: None,
        bio: None,
        timezone: Some("UTC".to_string()),
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    user_repo2.save(&user2).await?;

    // DB1からは見えないことを確認
    let not_found = user_repo1.find_by_id(&user_id2).await?;
    assert!(not_found.is_none());

    println!("✅ テストデータベース分離確認完了");

    Ok(())
}
