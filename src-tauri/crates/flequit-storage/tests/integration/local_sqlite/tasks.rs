//! タスク単体テスト
//!
//! testing.mdルール準拠のSQLiteタスクリポジトリテスト

use crate::models::{project::Project, task_list::TaskList, task::Task};
use crate::types::id_types::{ProjectId, TaskListId, TaskId, UserId};
use crate::types::project_types::ProjectStatus;
use crate::types::task_types::TaskStatus;
use crate::repositories::local_sqlite::{
    project::ProjectLocalSqliteRepository,
    task_list::TaskListLocalSqliteRepository,
    task::TaskLocalSqliteRepository,
};
use crate::repositories::base_repository_trait::Repository;
use uuid::Uuid;
use std::sync::Arc;

use crate::setup_sqlite_test;

#[tokio::test]
async fn test_task_create_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_task_create_operation")?;
    
    // リポジトリを初期化
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc);
    
    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Create操作タスクテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#2196F3".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo.save(&project).await?;
    
    // 親タスクリスト作成
    let task_list_id = TaskListId::from(Uuid::new_v4());
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "Create操作タスクリスト".to_string(),
        description: Some("Create操作テスト用タスクリスト".to_string()),
        color: Some("#FF9800".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    task_list_repo.save(&task_list).await?;
    
    // タスク作成
    let task_id = TaskId::from(Uuid::new_v4());
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "Create操作SQLiteタスク".to_string(),
        description: Some("Create操作SQLiteテスト用タスク".to_string()),
        status: TaskStatus::NotStarted,
        priority: 2,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // Create操作
    task_repo.save(&task).await?;
    
    // 作成確認
    let retrieved = task_repo.find_by_id(&task_id).await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, task.id);
    assert_eq!(retrieved.title, task.title);
    assert_eq!(retrieved.description, task.description);
    assert_eq!(retrieved.project_id, task.project_id);
    assert_eq!(retrieved.list_id, task.list_id);
    
    Ok(())
}

#[tokio::test]
async fn test_task_read_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_task_read_operation")?;
    
    // リポジトリを初期化
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc);
    
    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Read操作タスクテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#4CAF50".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo.save(&project).await?;
    
    // 親タスクリスト作成
    let task_list_id = TaskListId::from(Uuid::new_v4());
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "Read操作タスクリスト".to_string(),
        description: Some("Read操作テスト用タスクリスト".to_string()),
        color: Some("#E91E63".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    task_list_repo.save(&task_list).await?;
    
    // 2件のタスク作成
    let task_id1 = TaskId::from(Uuid::new_v4());
    let task1 = Task {
        id: task_id1.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "Read操作SQLiteタスク1".to_string(),
        description: Some("Read操作SQLiteテスト用タスク1".to_string()),
        status: TaskStatus::NotStarted,
        priority: 2,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let task_id2 = TaskId::from(Uuid::new_v4());
    let task2 = Task {
        id: task_id2.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "Read操作SQLiteタスク2".to_string(),
        description: Some("Read操作SQLiteテスト用タスク2".to_string()),
        status: TaskStatus::InProgress,
        priority: 1,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 2,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    task_repo.save(&task1).await?;
    task_repo.save(&task2).await?;
    
    // 1件目のみRead操作
    let retrieved = task_repo.find_by_id(&task_id1).await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, task1.id);
    assert_eq!(retrieved.title, task1.title);
    assert_eq!(retrieved.description, task1.description);
    assert_eq!(retrieved.status, task1.status);
    
    // 2件目が存在することも確認
    let retrieved2 = task_repo.find_by_id(&task_id2).await?;
    assert!(retrieved2.is_some());
    
    Ok(())
}

#[tokio::test]
async fn test_task_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_task_update_operation")?;
    
    // リポジトリを初期化
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc);
    
    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Update操作タスクテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#795548".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo.save(&project).await?;
    
    // 親タスクリスト作成
    let task_list_id = TaskListId::from(Uuid::new_v4());
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "Update操作タスクリスト".to_string(),
        description: Some("Update操作テスト用タスクリスト".to_string()),
        color: Some("#9C27B0".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    task_list_repo.save(&task_list).await?;
    
    // 2件のタスク作成
    let task_id1 = TaskId::from(Uuid::new_v4());
    let task1 = Task {
        id: task_id1.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "Update操作SQLiteタスク1".to_string(),
        description: Some("Update操作SQLiteテスト用タスク1".to_string()),
        status: TaskStatus::NotStarted,
        priority: 2,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let task_id2 = TaskId::from(Uuid::new_v4());
    let task2 = Task {
        id: task_id2.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "Update操作SQLiteタスク2".to_string(),
        description: Some("Update操作SQLiteテスト用タスク2".to_string()),
        status: TaskStatus::InProgress,
        priority: 1,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 2,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    task_repo.save(&task1).await?;
    task_repo.save(&task2).await?;
    
    // 1件目のみUpdate操作
    let mut updated = task1.clone();
    updated.title = "更新されたUpdate操作SQLiteタスク1".to_string();
    updated.description = Some("更新されたUpdate操作SQLiteテスト用タスク1".to_string());
    updated.status = TaskStatus::Completed;
    updated.priority = 3;
    task_repo.save(&updated).await?;
    
    // 更新後の取得確認（1件目）
    let updated_result = task_repo.find_by_id(&task_id1).await?;
    assert!(updated_result.is_some());
    let updated_result = updated_result.unwrap();
    assert_eq!(updated_result.title, updated.title);
    assert_eq!(updated_result.description, updated.description);
    assert_eq!(updated_result.status, updated.status);
    assert_eq!(updated_result.priority, updated.priority);
    
    // 2件目が変更されていないことを確認
    let retrieved2 = task_repo.find_by_id(&task_id2).await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.title, task2.title);
    assert_eq!(retrieved2.status, task2.status);
    
    Ok(())
}

#[tokio::test]
async fn test_task_delete_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_task_delete_operation")?;
    
    // リポジトリを初期化
    let db_manager = crate::repositories::local_sqlite::database_manager::DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc);
    
    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Delete操作タスクテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#3F51B5".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo.save(&project).await?;
    
    // 親タスクリスト作成
    let task_list_id = TaskListId::from(Uuid::new_v4());
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "Delete操作タスクリスト".to_string(),
        description: Some("Delete操作テスト用タスクリスト".to_string()),
        color: Some("#FF5722".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    task_list_repo.save(&task_list).await?;
    
    // 2件のタスク作成
    let task_id1 = TaskId::from(Uuid::new_v4());
    let task1 = Task {
        id: task_id1.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "Delete操作SQLiteタスク1".to_string(),
        description: Some("Delete操作SQLiteテスト用タスク1".to_string()),
        status: TaskStatus::NotStarted,
        priority: 2,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let task_id2 = TaskId::from(Uuid::new_v4());
    let task2 = Task {
        id: task_id2.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "Delete操作SQLiteタスク2".to_string(),
        description: Some("Delete操作SQLiteテスト用タスク2".to_string()),
        status: TaskStatus::InProgress,
        priority: 1,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 2,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    // 2件とも保存
    task_repo.save(&task1).await?;
    task_repo.save(&task2).await?;
    
    // 1件目のみDelete操作
    task_repo.delete(&task_id1).await?;
    
    // 削除確認（1件目）
    let deleted_check = task_repo.find_by_id(&task_id1).await?;
    assert!(deleted_check.is_none());
    
    // 2件目が削除されていないことを確認
    let retrieved2 = task_repo.find_by_id(&task_id2).await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.title, task2.title);
    
    Ok(())
}