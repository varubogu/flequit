//! プロジェクト単体テスト
//!
//! testing.mdルール準拠のSQLiteプロジェクトリポジトリテスト

use crate::models::project::Project;
use crate::types::id_types::{ProjectId, UserId};
use crate::types::project_types::ProjectStatus;
use crate::repositories::local_sqlite::project::ProjectLocalSqliteRepository;
use crate::repositories::base_repository_trait::Repository;
use uuid::Uuid;
use std::sync::Arc;

use crate::setup_sqlite_test;

#[tokio::test]
async fn test_project_create_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_project_create_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc);
    
    // テストデータ作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Create操作テストプロジェクト".to_string(),
        description: Some("Create操作のためのテストプロジェクト".to_string()),
        color: Some("#4CAF50".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // Create操作（saveメソッドを使用）
    project_repo.save(&project).await?;
    
    // 作成確認
    let retrieved_project = project_repo.find_by_id(&project_id).await?;
    assert!(retrieved_project.is_some());
    let retrieved_project = retrieved_project.unwrap();
    assert_eq!(retrieved_project.id, project.id);
    assert_eq!(retrieved_project.name, project.name);
    assert_eq!(retrieved_project.description, project.description);
    assert_eq!(retrieved_project.color, project.color);
    
    Ok(())
}

#[tokio::test]
async fn test_project_read_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_project_read_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc);
    
    // 2件のテストデータを作成
    let project_id1 = ProjectId::from(Uuid::new_v4());
    let project1 = Project {
        id: project_id1.clone(),
        name: "Read操作テストプロジェクト1".to_string(),
        description: Some("Read操作のためのテストプロジェクト1".to_string()),
        color: Some("#2196F3".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let project_id2 = ProjectId::from(Uuid::new_v4());
    let project2 = Project {
        id: project_id2.clone(),
        name: "Read操作テストプロジェクト2".to_string(),
        description: Some("Read操作のためのテストプロジェクト2".to_string()),
        color: Some("#FF5722".to_string()),
        order_index: 2,
        is_archived: false,
        status: Some(ProjectStatus::Planning),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    project_repo.save(&project1).await?;
    project_repo.save(&project2).await?;
    
    // 1件目のみRead操作
    let retrieved_project = project_repo.find_by_id(&project_id1).await?;
    assert!(retrieved_project.is_some());
    let retrieved_project = retrieved_project.unwrap();
    assert_eq!(retrieved_project.id, project1.id);
    assert_eq!(retrieved_project.name, project1.name);
    assert_eq!(retrieved_project.description, project1.description);
    assert_eq!(retrieved_project.color, project1.color);
    
    // 2件目が存在することも確認
    let retrieved_project2 = project_repo.find_by_id(&project_id2).await?;
    assert!(retrieved_project2.is_some());
    
    Ok(())
}

#[tokio::test]
async fn test_project_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_project_update_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc);
    
    // 2件のテストデータを作成
    let project_id1 = ProjectId::from(Uuid::new_v4());
    let project1 = Project {
        id: project_id1.clone(),
        name: "Update操作テストプロジェクト1".to_string(),
        description: Some("Update操作のためのテストプロジェクト1".to_string()),
        color: Some("#9C27B0".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let project_id2 = ProjectId::from(Uuid::new_v4());
    let project2 = Project {
        id: project_id2.clone(),
        name: "Update操作テストプロジェクト2".to_string(),
        description: Some("Update操作のためのテストプロジェクト2".to_string()),
        color: Some("#795548".to_string()),
        order_index: 2,
        is_archived: false,
        status: Some(ProjectStatus::OnHold),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    project_repo.save(&project1).await?;
    project_repo.save(&project2).await?;
    
    // 1件目のみUpdate操作
    let mut updated_project = project1.clone();
    updated_project.name = "更新されたUpdate操作テストプロジェクト1".to_string();
    updated_project.description = Some("更新されたUpdate操作のためのテストプロジェクト1".to_string());
    updated_project.status = Some(ProjectStatus::Completed);
    project_repo.save(&updated_project).await?;
    
    // 更新後の取得確認（1件目）
    let retrieved_updated = project_repo.find_by_id(&project_id1).await?;
    assert!(retrieved_updated.is_some());
    let retrieved_updated = retrieved_updated.unwrap();
    assert_eq!(retrieved_updated.name, updated_project.name);
    assert_eq!(retrieved_updated.description, updated_project.description);
    assert_eq!(retrieved_updated.status, updated_project.status);
    
    // 2件目が変更されていないことを確認
    let retrieved_project2 = project_repo.find_by_id(&project_id2).await?;
    assert!(retrieved_project2.is_some());
    let retrieved_project2 = retrieved_project2.unwrap();
    assert_eq!(retrieved_project2.name, project2.name);
    assert_eq!(retrieved_project2.status, project2.status);
    
    Ok(())
}

#[tokio::test]
async fn test_project_delete_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_project_delete_operation")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc);
    
    // 2件のテストデータを作成
    let project_id1 = ProjectId::from(Uuid::new_v4());
    let project1 = Project {
        id: project_id1.clone(),
        name: "Delete操作テストプロジェクト1".to_string(),
        description: Some("Delete操作のためのテストプロジェクト1".to_string()),
        color: Some("#607D8B".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let project_id2 = ProjectId::from(Uuid::new_v4());
    let project2 = Project {
        id: project_id2.clone(),
        name: "Delete操作テストプロジェクト2".to_string(),
        description: Some("Delete操作のためのテストプロジェクト2".to_string()),
        color: Some("#FF9800".to_string()),
        order_index: 2,
        is_archived: false,
        status: Some(ProjectStatus::Archived),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    project_repo.save(&project1).await?;
    project_repo.save(&project2).await?;
    
    // 1件目のみDelete操作
    project_repo.delete(&project_id1).await?;
    
    // 削除確認（1件目）
    let deleted_check = project_repo.find_by_id(&project_id1).await?;
    assert!(deleted_check.is_none());
    
    // 2件目が削除されていないことを確認
    let retrieved_project2 = project_repo.find_by_id(&project_id2).await?;
    assert!(retrieved_project2.is_some());
    let retrieved_project2 = retrieved_project2.unwrap();
    assert_eq!(retrieved_project2.name, project2.name);
    
    Ok(())
}

#[tokio::test]
async fn test_repository_isolation() -> Result<(), Box<dyn std::error::Error>> {
    // 複数のテストが独立していることを確認
    let db_path1 = setup_sqlite_test!("test_repository_isolation_1")?;
    let db_path2 = setup_sqlite_test!("test_repository_isolation_2")?;
    
    // 異なるデータベースパスを使用していることを確認
    assert_ne!(db_path1, db_path2);
    
    // それぞれのデータベースが独立して動作することを確認
    let db_manager1 = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path1.to_string_lossy().to_string());
    let db_manager2 = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path2.to_string_lossy().to_string());
    
    let project_repo1 = ProjectLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager1)));
    let project_repo2 = ProjectLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager2)));
    
    // DB1にプロジェクト作成
    let project_id1 = ProjectId::from(Uuid::new_v4());
    let project1 = Project {
        id: project_id1.clone(),
        name: "DB1プロジェクト".to_string(),
        description: None,
        color: Some("#E91E63".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo1.save(&project1).await?;
    
    // DB2からは見えないことを確認
    let not_found = project_repo2.find_by_id(&project_id1).await?;
    assert!(not_found.is_none());
    
    // DB2にも別のプロジェクト作成
    let project_id2 = ProjectId::from(Uuid::new_v4());
    let project2 = Project {
        id: project_id2.clone(),
        name: "DB2プロジェクト".to_string(),
        description: None,
        color: Some("#9C27B0".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo2.save(&project2).await?;
    
    // DB1からは見えないことを確認
    let not_found = project_repo1.find_by_id(&project_id2).await?;
    assert!(not_found.is_none());
    
    println!("✅ テストデータベース分離確認完了");
    
    Ok(())
}

#[tokio::test]
async fn test_sqlite_data_persistence_debug() -> Result<(), Box<dyn std::error::Error>> {
    // デバッグ用テスト - データが実際にファイルに保存されるかを確認
    let db_path = setup_sqlite_test!("test_sqlite_data_persistence_debug")?;
    
    println!("🔍 デバッグテスト開始: {}", db_path.display());
    
    // リポジトリを初期化
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    
    // テストデータ作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "デバッグテストプロジェクト".to_string(),
        description: Some("データ永続化の確認用".to_string()),
        color: Some("#FF0000".to_string()),
        order_index: 999,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    println!("💾 プロジェクト保存前");
    
    // 保存
    project_repo.save(&project).await?;
    
    println!("💾 プロジェクト保存後");
    
    // 保存直後の取得確認
    let retrieved = project_repo.find_by_id(&project_id).await?;
    assert!(retrieved.is_some());
    println!("✅ メモリ内での取得成功: {}", retrieved.as_ref().unwrap().name);
    
    // データベース接続を明示的に確認
    {
        let db_manager_lock = db_manager_arc.read().await;
        let db_conn = db_manager_lock.get_connection().await?;
        
        // 直接SQLクエリでデータ確認
        use sea_orm::{EntityTrait, PaginatorTrait};
        let count = crate::models::sqlite::project::Entity::find()
            .count(db_conn)
            .await?;
        
        println!("📊 テーブル内のレコード数: {}", count);
        
        // 実際のレコードを確認
        let all_records = crate::models::sqlite::project::Entity::find()
            .all(db_conn)
            .await?;
            
        for record in &all_records {
            println!("📄 レコード: id={}, name={}", record.id, record.name);
        }
    }
    
    // 明示的にDBフラッシュを試みる
    println!("🔄 データベース同期開始");
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    println!("🔄 データベース同期完了");
    
    // ファイルサイズ確認
    let file_metadata = std::fs::metadata(&db_path)?;
    println!("📁 DBファイルサイズ: {} bytes", file_metadata.len());
    
    if file_metadata.len() == 0 {
        println!("❌ DBファイルが空です！");
    } else {
        println!("✅ DBファイルにデータが存在します");
    }
    
    println!("🔍 デバッグテスト完了");
    
    Ok(())
}