//! Local SQLite Repository結合テスト
//!
//! testing.mdルール準拠のSQLiteリポジトリテスト

use flequit_lib::models::{
    project::Project, task_list::TaskList, task::Task, subtask::SubTask, tag::Tag
};
use flequit_lib::types::id_types::{ProjectId, TaskListId, UserId};
use flequit_lib::types::project_types::ProjectStatus;
use flequit_lib::repositories::local_sqlite::{
    project::ProjectLocalSqliteRepository, 
    task_list::TaskListLocalSqliteRepository,
    task::TaskLocalSqliteRepository, 
    subtask::SubtaskLocalSqliteRepository, 
    tag::TagLocalSqliteRepository
};
use flequit_lib::repositories::{
    base_repository_trait::Repository,
    project_repository_trait::ProjectRepositoryTrait,
    task_list_repository_trait::TaskListRepositoryTrait,
    task_repository_trait::TaskRepositoryTrait,
    sub_task_repository_trait::SubTaskRepositoryTrait,
    tag_repository_trait::TagRepositoryTrait
};
use uuid::Uuid;
use std::sync::Arc;

use crate::{test_utils::SqliteTestHarness, setup_sqlite_test};

#[tokio::test]
async fn test_project_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_project_crud_operations")?;
    
    // リポジトリを初期化（非シングルトン）
    let db_manager = flequit_lib::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc);
    
    // テストデータ作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "SQLite統合テストプロジェクト".to_string(),
        description: Some("SQLite Repository統合テストのためのプロジェクト".to_string()),
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
    
    // Read操作
    let retrieved_project = project_repo.find_by_id(&project_id).await?;
    assert!(retrieved_project.is_some());
    let retrieved_project = retrieved_project.unwrap();
    assert_eq!(retrieved_project.id, project.id);
    assert_eq!(retrieved_project.name, project.name);
    
    // Update操作（saveメソッドで更新）
    let mut updated_project = retrieved_project.clone();
    updated_project.name = "更新されたSQLite統合テストプロジェクト".to_string();
    project_repo.save(&updated_project).await?;
    
    // 更新後の取得確認
    let retrieved_updated = project_repo.find_by_id(&project_id).await?;
    assert!(retrieved_updated.is_some());
    assert_eq!(retrieved_updated.unwrap().name, updated_project.name);
    
    // Delete操作
    project_repo.delete(&project_id).await?;
    
    // 削除確認
    let deleted_check = project_repo.find_by_id(&project_id).await?;
    assert!(deleted_check.is_none());
    
    Ok(())
}

#[tokio::test]
async fn test_task_list_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_task_list_crud_operations")?;
    
    // リポジトリを初期化
    let db_manager = flequit_lib::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc);
    
    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "タスクリストテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#2196F3".to_string()),
        order_index: 2,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo.save(&project).await?;
    
    // タスクリスト作成
    let task_list_id = TaskListId::from(Uuid::new_v4());
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "SQLiteタスクリスト".to_string(),
        description: Some("SQLiteテスト用タスクリスト".to_string()),
        color: Some("#FF9800".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // CRUD操作テスト
    task_list_repo.save(&task_list).await?;
    
    let retrieved = task_list_repo.find_by_id(&task_list_id).await?;
    assert!(retrieved.is_some());
    
    let mut updated = retrieved.unwrap();
    updated.name = "更新されたSQLiteタスクリスト".to_string();
    task_list_repo.save(&updated).await?;
    
    let updated_result = task_list_repo.find_by_id(&task_list_id).await?;
    assert!(updated_result.is_some());
    assert_eq!(updated_result.unwrap().name, updated.name);
    
    task_list_repo.delete(&task_list_id).await?;
    let deleted_check = task_list_repo.find_by_id(&task_list_id).await?;
    assert!(deleted_check.is_none());
    
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
    let db_manager1 = flequit_lib::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path1.to_string_lossy().to_string());
    let db_manager2 = flequit_lib::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path2.to_string_lossy().to_string());
    
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