//! タスクリスト単体テスト
//!
//! testing.mdルール準拠のSQLiteタスクリストリポジトリテスト

use chrono::{DateTime, Utc};
use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    project::ProjectLocalSqliteRepository, task_list::TaskListLocalSqliteRepository,
};
use flequit_model::models::task_projects::{project::Project, task_list::TaskList};
use flequit_model::types::id_types::{ProjectId, TaskListId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use flequit_repository::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::base_repository_trait::Repository;
use function_name::named;
use std::sync::Arc;
use uuid::Uuid;

use flequit_testing::TestPathGenerator;

use crate::integration::support::sqlite::SqliteTestHarness;

#[named]
#[tokio::test]
async fn test_task_list_create_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let project = Project {
        id: project_id.clone(),
        name: "Create操作タスクリストテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#2196F3".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };
    project_repo.save(&project, &user_id, &timestamp).await?;

    // タスクリスト作成
    let task_list_id = TaskListId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "Create操作SQLiteタスクリスト".to_string(),
        description: Some("Create操作SQLiteテスト用タスクリスト".to_string()),
        color: Some("#FF9800".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // Create操作
    task_list_repo.save(&project_id, &task_list, &user_id, &timestamp).await?;

    // 作成確認
    let retrieved = task_list_repo
        .find_by_id(&project_id, &task_list_id)
        .await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, task_list.id);
    assert_eq!(retrieved.name, task_list.name);
    assert_eq!(retrieved.description, task_list.description);
    assert_eq!(retrieved.project_id, task_list.project_id);

    Ok(())
}

#[named]
#[tokio::test]
async fn test_task_list_read_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let project = Project {
        id: project_id.clone(),
        name: "Read操作タスクリストテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#4CAF50".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };
    project_repo.save(&project, &user_id, &timestamp).await?;

    // 2件のタスクリスト作成
    let task_list_id1 = TaskListId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let task_list1 = TaskList {
        id: task_list_id1.clone(),
        project_id: project_id.clone(),
        name: "Read操作SQLiteタスクリスト1".to_string(),
        description: Some("Read操作SQLiteテスト用タスクリスト1".to_string()),
        color: Some("#E91E63".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    let task_list_id2 = TaskListId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let task_list2 = TaskList {
        id: task_list_id2.clone(),
        project_id: project_id.clone(),
        name: "Read操作SQLiteタスクリスト2".to_string(),
        description: Some("Read操作SQLiteテスト用タスクリスト2".to_string()),
        color: Some("#9C27B0".to_string()),
        order_index: 2,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 2件とも保存
    task_list_repo.save(&project_id, &task_list1, &user_id, &timestamp).await?;
    task_list_repo.save(&project_id, &task_list2, &user_id, &timestamp).await?;

    // 1件目のみRead操作
    let retrieved = task_list_repo
        .find_by_id(&project_id, &task_list_id1)
        .await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, task_list1.id);
    assert_eq!(retrieved.name, task_list1.name);
    assert_eq!(retrieved.description, task_list1.description);
    assert_eq!(retrieved.color, task_list1.color);

    // 2件目が存在することも確認
    let retrieved2 = task_list_repo
        .find_by_id(&project_id, &task_list_id2)
        .await?;
    assert!(retrieved2.is_some());

    Ok(())
}

#[named]
#[tokio::test]
async fn test_task_list_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let project = Project {
        id: project_id.clone(),
        name: "Update操作タスクリストテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#795548".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };
    project_repo.save(&project, &user_id, &timestamp).await?;

    // 2件のタスクリスト作成
    let task_list_id1 = TaskListId::from(Uuid::new_v4());
    let task_list1 = TaskList {
        id: task_list_id1.clone(),
        project_id: project_id.clone(),
        name: "Update操作SQLiteタスクリスト1".to_string(),
        description: Some("Update操作SQLiteテスト用タスクリスト1".to_string()),
        color: Some("#FF5722".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    let task_list_id2 = TaskListId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let task_list2 = TaskList {
        id: task_list_id2.clone(),
        project_id: project_id.clone(),
        name: "Update操作SQLiteタスクリスト2".to_string(),
        description: Some("Update操作SQLiteテスト用タスクリスト2".to_string()),
        color: Some("#607D8B".to_string()),
        order_index: 2,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 2件とも保存
    task_list_repo.save(&project_id, &task_list1, &user_id, &timestamp).await?;
    task_list_repo.save(&project_id, &task_list2, &user_id, &timestamp).await?;

    // 1件目のみUpdate操作
    let mut updated = task_list1.clone();
    updated.name = "更新されたUpdate操作SQLiteタスクリスト1".to_string();
    updated.description = Some("更新されたUpdate操作SQLiteテスト用タスクリスト1".to_string());
    updated.color = Some("#009688".to_string());
    task_list_repo.save(&project_id, &updated, &user_id, &timestamp).await?;

    // 更新後の取得確認（1件目）
    let updated_result = task_list_repo
        .find_by_id(&project_id, &task_list_id1)
        .await?;
    assert!(updated_result.is_some());
    let updated_result = updated_result.unwrap();
    assert_eq!(updated_result.name, updated.name);
    assert_eq!(updated_result.description, updated.description);
    assert_eq!(updated_result.color, updated.color);

    // 2件目が変更されていないことを確認
    let retrieved2 = task_list_repo
        .find_by_id(&project_id, &task_list_id2)
        .await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.name, task_list2.name);
    assert_eq!(retrieved2.color, task_list2.color);

    Ok(())
}

#[named]
#[tokio::test]
async fn test_task_list_delete_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let project = Project {
        id: project_id.clone(),
        name: "Delete操作タスクリストテスト用プロジェクト".to_string(),
        description: None,
        color: Some("#3F51B5".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };
    project_repo.save(&project, &user_id, &timestamp).await?;

    // 2件のタスクリスト作成
    let task_list_id1 = TaskListId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let task_list1 = TaskList {
        id: task_list_id1.clone(),
        project_id: project_id.clone(),
        name: "Delete操作SQLiteタスクリスト1".to_string(),
        description: Some("Delete操作SQLiteテスト用タスクリスト1".to_string()),
        color: Some("#FF9800".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    let task_list_id2 = TaskListId::from(Uuid::new_v4());
    let user_id = UserId::from(Uuid::new_v4());
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let task_list2 = TaskList {
        id: task_list_id2.clone(),
        project_id: project_id.clone(),
        name: "Delete操作SQLiteタスクリスト2".to_string(),
        description: Some("Delete操作SQLiteテスト用タスクリスト2".to_string()),
        color: Some("#673AB7".to_string()),
        order_index: 2,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    // 2件とも保存
    task_list_repo.save(&project_id, &task_list1, &user_id, &timestamp).await?;
    task_list_repo.save(&project_id, &task_list2, &user_id, &timestamp).await?;

    // 1件目のみDelete操作
    task_list_repo.delete(&project_id, &task_list_id1).await?;

    // 削除確認（1件目）
    let deleted_check = task_list_repo
        .find_by_id(&project_id, &task_list_id1)
        .await?;
    assert!(deleted_check.is_none());

    // 2件目が削除されていないことを確認
    let retrieved2 = task_list_repo
        .find_by_id(&project_id, &task_list_id2)
        .await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.name, task_list2.name);

    Ok(())
}
