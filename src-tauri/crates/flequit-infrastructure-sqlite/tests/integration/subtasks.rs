//! サブタスク単体テスト
//!
//! testing.mdルール準拠のSQLiteサブタスクリポジトリテスト

use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    project::ProjectLocalSqliteRepository, subtask::SubTaskLocalSqliteRepository,
    task::TaskLocalSqliteRepository, task_list::TaskListLocalSqliteRepository,
};
use flequit_model::models::task_projects::{
    project::Project, subtask::SubTask, task::Task, task_list::TaskList,
};
use flequit_model::types::id_types::{ProjectId, SubTaskId, TaskId, TaskListId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use flequit_model::types::task_types::TaskStatus;
use flequit_repository::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::base_repository_trait::Repository;
use std::sync::Arc;
use uuid::Uuid;

use crate::integration::support::sqlite::SqliteTestHarness;
use flequit_testing::TestPathGenerator;
use function_name::named;

#[named]
#[tokio::test]
async fn test_subtask_create_operation() -> Result<(), Box<dyn std::error::Error>> {
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
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc.clone());
    let subtask_repo = SubTaskLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Create操作サブタスクテスト用プロジェクト".to_string(),
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
    task_list_repo.save(&project_id, &task_list).await?;

    // 親タスク作成
    let task_id = TaskId::from(Uuid::new_v4());
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "Create操作親タスク".to_string(),
        description: Some("Create操作テスト用親タスク".to_string()),
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
    task_repo.save(&project_id, &task).await?;

    // サブタスク作成
    let subtask_id = SubTaskId::from(Uuid::new_v4());
    let subtask = SubTask {
        id: subtask_id.clone(),
        task_id: task_id.clone(),
        title: "Create操作SQLiteサブタスク".to_string(),
        description: Some("Create操作SQLiteテスト用サブタスク".to_string()),
        status: TaskStatus::NotStarted,
        priority: Some(2),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        completed: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // Create操作
    subtask_repo.save(&project_id, &subtask).await?;

    // 作成確認
    let retrieved = subtask_repo.find_by_id(&project_id, &subtask_id).await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, subtask.id);
    assert_eq!(retrieved.title, subtask.title);
    assert_eq!(retrieved.description, subtask.description);
    assert_eq!(retrieved.task_id, subtask.task_id);

    Ok(())
}

#[named]
#[tokio::test]
async fn test_subtask_read_operation() -> Result<(), Box<dyn std::error::Error>> {
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
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc.clone());
    let subtask_repo = SubTaskLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Read操作サブタスクテスト用プロジェクト".to_string(),
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
    task_list_repo.save(&project_id, &task_list).await?;

    // 親タスク作成
    let task_id = TaskId::from(Uuid::new_v4());
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "Read操作親タスク".to_string(),
        description: Some("Read操作テスト用親タスク".to_string()),
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
    task_repo.save(&project_id, &task).await?;

    // 2件のサブタスク作成
    let subtask_id1 = SubTaskId::from(Uuid::new_v4());
    let subtask1 = SubTask {
        id: subtask_id1.clone(),
        task_id: task_id.clone(),
        title: "Read操作SQLiteサブタスク1".to_string(),
        description: Some("Read操作SQLiteテスト用サブタスク1".to_string()),
        status: TaskStatus::NotStarted,
        priority: Some(2),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        completed: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let subtask_id2 = SubTaskId::from(Uuid::new_v4());
    let subtask2 = SubTask {
        id: subtask_id2.clone(),
        task_id: task_id.clone(),
        title: "Read操作SQLiteサブタスク2".to_string(),
        description: Some("Read操作SQLiteテスト用サブタスク2".to_string()),
        status: TaskStatus::InProgress,
        priority: Some(1),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 2,
        completed: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // 2件とも保存
    subtask_repo.save(&project_id, &subtask1).await?;
    subtask_repo.save(&project_id, &subtask2).await?;

    // 1件目のみRead操作
    let retrieved = subtask_repo.find_by_id(&project_id, &subtask_id1).await?;
    assert!(retrieved.is_some());
    let retrieved = retrieved.unwrap();
    assert_eq!(retrieved.id, subtask1.id);
    assert_eq!(retrieved.title, subtask1.title);
    assert_eq!(retrieved.description, subtask1.description);
    assert_eq!(retrieved.status, subtask1.status);

    // 2件目が存在することも確認
    let retrieved2 = subtask_repo.find_by_id(&project_id, &subtask_id2).await?;
    assert!(retrieved2.is_some());

    Ok(())
}

#[named]
#[tokio::test]
async fn test_subtask_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc.clone());
    let subtask_repo = SubTaskLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Update操作サブタスクテスト用プロジェクト".to_string(),
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
    task_list_repo.save(&project_id, &task_list).await?;

    // 親タスク作成
    let task_id = TaskId::from(Uuid::new_v4());
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "Update操作親タスク".to_string(),
        description: Some("Update操作テスト用親タスク".to_string()),
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
    task_repo.save(&project_id, &task).await?;

    // 2件のサブタスク作成
    let subtask_id1 = SubTaskId::from(Uuid::new_v4());
    let subtask1 = SubTask {
        id: subtask_id1.clone(),
        task_id: task_id.clone(),
        title: "Update操作SQLiteサブタスク1".to_string(),
        description: Some("Update操作SQLiteテスト用サブタスク1".to_string()),
        status: TaskStatus::NotStarted,
        priority: Some(2),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        completed: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let subtask_id2 = SubTaskId::from(Uuid::new_v4());
    let subtask2 = SubTask {
        id: subtask_id2.clone(),
        task_id: task_id.clone(),
        title: "Update操作SQLiteサブタスク2".to_string(),
        description: Some("Update操作SQLiteテスト用サブタスク2".to_string()),
        status: TaskStatus::InProgress,
        priority: Some(1),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 2,
        completed: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // 2件とも保存
    subtask_repo.save(&project_id, &subtask1).await?;
    subtask_repo.save(&project_id, &subtask2).await?;

    // 1件目のみUpdate操作
    let mut updated = subtask1.clone();
    updated.title = "更新されたUpdate操作SQLiteサブタスク1".to_string();
    updated.description = Some("更新されたUpdate操作SQLiteテスト用サブタスク1".to_string());
    updated.status = TaskStatus::Completed;
    updated.priority = Some(3);
    updated.completed = true;
    updated.do_end_date = Some(chrono::Utc::now());
    subtask_repo.save(&project_id, &updated).await?;

    // 更新後の取得確認（1件目）
    let updated_result = subtask_repo.find_by_id(&project_id, &subtask_id1).await?;
    assert!(updated_result.is_some());
    let updated_result = updated_result.unwrap();
    assert_eq!(updated_result.title, updated.title);
    assert_eq!(updated_result.description, updated.description);
    assert_eq!(updated_result.status, updated.status);
    assert_eq!(updated_result.priority, updated.priority);
    assert_eq!(updated_result.completed, updated.completed);

    // 2件目が変更されていないことを確認
    let retrieved2 = subtask_repo.find_by_id(&project_id, &subtask_id2).await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.title, subtask2.title);
    assert_eq!(retrieved2.status, subtask2.status);

    Ok(())
}

#[named]
#[tokio::test]
async fn test_subtask_delete_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(&output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc.clone());
    let subtask_repo = SubTaskLocalSqliteRepository::new(db_manager_arc);

    // 親プロジェクト作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "Delete操作サブタスクテスト用プロジェクト".to_string(),
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
    task_list_repo.save(&project_id, &task_list).await?;

    // 親タスク作成
    let task_id = TaskId::from(Uuid::new_v4());
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "Delete操作親タスク".to_string(),
        description: Some("Delete操作テスト用親タスク".to_string()),
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
    task_repo.save(&project_id, &task).await?;

    // 2件のサブタスク作成
    let subtask_id1 = SubTaskId::from(Uuid::new_v4());
    let subtask1 = SubTask {
        id: subtask_id1.clone(),
        task_id: task_id.clone(),
        title: "Delete操作SQLiteサブタスク1".to_string(),
        description: Some("Delete操作SQLiteテスト用サブタスク1".to_string()),
        status: TaskStatus::NotStarted,
        priority: Some(2),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        completed: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let subtask_id2 = SubTaskId::from(Uuid::new_v4());
    let subtask2 = SubTask {
        id: subtask_id2.clone(),
        task_id: task_id.clone(),
        title: "Delete操作SQLiteサブタスク2".to_string(),
        description: Some("Delete操作SQLiteテスト用サブタスク2".to_string()),
        status: TaskStatus::InProgress,
        priority: Some(1),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 2,
        completed: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // 2件とも保存
    subtask_repo.save(&project_id, &subtask1).await?;
    subtask_repo.save(&project_id, &subtask2).await?;

    // 1件目のみDelete操作
    subtask_repo.delete(&project_id, &subtask_id1).await?;

    // 削除確認（1件目）
    let deleted_check = subtask_repo.find_by_id(&project_id, &subtask_id1).await?;
    assert!(deleted_check.is_none());

    // 2件目が削除されていないことを確認
    let retrieved2 = subtask_repo.find_by_id(&project_id, &subtask_id2).await?;
    assert!(retrieved2.is_some());
    let retrieved2 = retrieved2.unwrap();
    assert_eq!(retrieved2.title, subtask2.title);

    Ok(())
}
