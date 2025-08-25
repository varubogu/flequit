//! Local SQLite Repository結合テスト
//!
//! SQLiteリポジトリのCRUD操作と実際のデータベース連携をテストし、
//! 各エンティティの保存・取得・更新・削除機能を結合テストレベルで検証する

use chrono::Utc;
use serde_json::json;
use std::path::{Path, PathBuf};
use tempfile::TempDir;

// テストハーネスのインポート
use super::test_harness::SqliteTestHarness;

use flequit_lib::models::project::Project;
use flequit_lib::models::subtask::SubTask;
use flequit_lib::models::tag::Tag;
use flequit_lib::models::task::Task;
use flequit_lib::models::task_list::TaskList;
use flequit_lib::repositories::base_repository_trait::Repository;
use flequit_lib::repositories::local_sqlite::{
    database_manager::DatabaseManager,
    project::ProjectLocalSqliteRepository,
    subtask::SubtaskLocalSqliteRepository,
    tag::TagLocalSqliteRepository,
    task::TaskLocalSqliteRepository,
    task_list::TaskListLocalSqliteRepository,
};
use flequit_lib::types::id_types::{ProjectId, SubTaskId, TagId, TaskId, TaskListId, UserId};
use flequit_lib::types::task_types::TaskStatus;

/// テスト結果の永続保存用ヘルパー関数
fn create_persistent_test_dir(test_name: &str) -> PathBuf {
    SqliteTestHarness::create_persistent_test_dir(test_name)
}

/// テストの永続保存ディレクトリにファイルをコピーするヘルパー
fn copy_to_persistent_storage(
    src_dir: &Path,
    dest_dir: &Path,
    test_name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    SqliteTestHarness::copy_to_persistent_storage(src_dir, dest_dir, test_name)
}

/// テスト用のデータベースマネージャーを作成（ハーネス使用）
async fn create_test_database_manager(test_name: &str) -> Result<std::sync::Arc<tokio::sync::RwLock<DatabaseManager>>, Box<dyn std::error::Error>> {
    // 新しいテストハーネスを使用
    SqliteTestHarness::create_test_database(test_name).await
}


/// プロジェクトリポジトリの基本CRUD操作テスト
#[tokio::test]
async fn test_project_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let persistent_dir = create_persistent_test_dir("test_project_repository_crud_operations");
    
    // データベースマネージャーを作成
    let db_manager = create_test_database_manager("project_crud").await?;
    
    // プロジェクトリポジトリを作成
    let repository = ProjectLocalSqliteRepository::new(db_manager);

    // テスト用プロジェクトデータを作成
    let project_id = ProjectId::new();
    let project = Project {
        id: project_id.clone(),
        name: "SQLite統合テストプロジェクト".to_string(),
        description: Some("SQLite Repository統合テストのためのプロジェクト".to_string()),
        color: Some("#ff5733".to_string()),
        order_index: 1,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    println!("Creating project: {:?}", project.name);

    // Create操作テスト
    repository.save(&project).await?;
    println!("✅ Project created successfully");

    // Read操作テスト
    let retrieved_project = repository.find_by_id(&project_id).await?;
    assert!(retrieved_project.is_some());
    let retrieved = retrieved_project.unwrap();
    assert_eq!(retrieved.name, project.name);
    assert_eq!(retrieved.description, project.description);
    println!("✅ Project retrieved successfully: {}", retrieved.name);

    // Update操作テスト
    let mut updated_project = project.clone();
    updated_project.name = "更新されたSQLite統合テストプロジェクト".to_string();
    updated_project.description = Some("更新されたプロジェクト説明".to_string());
    updated_project.updated_at = Utc::now();

    repository.save(&updated_project).await?;
    let retrieved_updated = repository.find_by_id(&project_id).await?;
    assert!(retrieved_updated.is_some());
    let updated = retrieved_updated.unwrap();
    assert_eq!(updated.name, updated_project.name);
    assert_eq!(updated.description, updated_project.description);
    println!("✅ Project updated successfully: {}", updated.name);

    // List操作テスト
    let all_projects = repository.find_all().await?;
    assert!(!all_projects.is_empty());
    let count = all_projects.len();
    println!("✅ Found {} project(s)", count);

    // Exists操作テスト
    let exists = repository.exists(&project_id).await?;
    assert!(exists);
    println!("✅ Project existence confirmed");

    // Delete操作テスト
    repository.delete(&project_id).await?;
    let deleted_check = repository.find_by_id(&project_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Project deleted successfully");

    // Count操作テスト
    let count_after_delete = repository.count().await?;
    assert_eq!(count_after_delete as usize, count - 1);
    println!("✅ Count verified after deletion: {}", count_after_delete);

    // テスト結果を永続保存
    copy_to_persistent_storage(
        &std::env::temp_dir(),
        &persistent_dir,
        "test_project_repository_crud_operations",
    )?;

    println!("🎉 プロジェクトリポジトリCRUD操作テスト完了");
    Ok(())
}

/// タスクリストリポジトリの基本CRUD操作テスト
#[tokio::test]
async fn test_task_list_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let persistent_dir = create_persistent_test_dir("test_task_list_repository_crud_operations");
    
    // データベースマネージャーを作成
    let db_manager = create_test_database_manager("task_list_crud").await?;
    
    let task_list_repository = TaskListLocalSqliteRepository::new(db_manager.clone());
    let project_repository = ProjectLocalSqliteRepository::new(db_manager);

    // 前提条件：プロジェクトを作成
    let project_id = ProjectId::new();
    let project = Project {
        id: project_id.clone(),
        name: "TaskList Test Project".to_string(),
        description: Some("タスクリストテスト用プロジェクト".to_string()),
        color: Some("#333333".to_string()),
        order_index: 1,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    project_repository.save(&project).await?;

    // テスト用タスクリストデータを作成
    let task_list_id = TaskListId::new();
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "SQLiteタスクリスト".to_string(),
        description: Some("SQLiteテスト用タスクリスト".to_string()),
        color: Some("#00ff00".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    println!("Creating task list: {:?}", task_list.name);

    // Create操作テスト
    task_list_repository.save(&task_list).await?;
    println!("✅ Task list created successfully");

    // Read操作テスト
    let retrieved_task_list = task_list_repository.find_by_id(&task_list_id).await?;
    assert!(retrieved_task_list.is_some());
    let retrieved = retrieved_task_list.unwrap();
    assert_eq!(retrieved.name, task_list.name);
    assert_eq!(retrieved.project_id, task_list.project_id);
    println!("✅ Task list retrieved successfully: {}", retrieved.name);

    // Update操作テスト
    let mut updated_task_list = task_list.clone();
    updated_task_list.name = "更新されたSQLiteタスクリスト".to_string();
    updated_task_list.description = Some("更新された説明".to_string());
    updated_task_list.updated_at = Utc::now();

    task_list_repository.save(&updated_task_list).await?;
    let retrieved_updated = task_list_repository.find_by_id(&task_list_id).await?;
    assert!(retrieved_updated.is_some());
    let updated = retrieved_updated.unwrap();
    assert_eq!(updated.name, updated_task_list.name);
    println!("✅ Task list updated successfully: {}", updated.name);

    // Delete操作テスト
    task_list_repository.delete(&task_list_id).await?;
    let deleted_check = task_list_repository.find_by_id(&task_list_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Task list deleted successfully");

    // テスト結果を永続保存
    copy_to_persistent_storage(
        &std::env::temp_dir(),
        &persistent_dir,
        "test_task_list_repository_crud_operations",
    )?;

    println!("🎉 タスクリストリポジトリCRUD操作テスト完了");
    Ok(())
}

/// タスクリポジトリの基本CRUD操作テスト
#[tokio::test]
async fn test_task_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let persistent_dir = create_persistent_test_dir("test_task_repository_crud_operations");
    
    // データベースマネージャーを作成
    let db_manager = create_test_database_manager("task_crud").await?;
    
    let task_repository = TaskLocalSqliteRepository::new(db_manager.clone());
    let project_repository = ProjectLocalSqliteRepository::new(db_manager.clone());
    let task_list_repository = TaskListLocalSqliteRepository::new(db_manager);

    // 前提条件：プロジェクトとタスクリストを作成
    let project_id = ProjectId::new();
    let project = Project {
        id: project_id.clone(),
        name: "Task Test Project".to_string(),
        description: Some("タスクテスト用プロジェクト".to_string()),
        color: Some("#444444".to_string()),
        order_index: 1,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    project_repository.save(&project).await?;

    let task_list_id = TaskListId::new();
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "タスクテスト用リスト".to_string(),
        description: None,
        color: None,
        order_index: 1,
        is_archived: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    task_list_repository.save(&task_list).await?;

    // テスト用タスクデータを作成
    let task_id = TaskId::new();
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "SQLiteタスク".to_string(),
        description: Some("SQLiteテスト用タスク".to_string()),
        status: TaskStatus::NotStarted,
        priority: 3,
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
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    println!("Creating task: {:?}", task.title);

    // Create操作テスト
    task_repository.save(&task).await?;
    println!("✅ Task created successfully");

    // Read操作テスト
    let retrieved_task = task_repository.find_by_id(&task_id).await?;
    assert!(retrieved_task.is_some());
    let retrieved = retrieved_task.unwrap();
    assert_eq!(retrieved.title, task.title);
    assert_eq!(retrieved.status, task.status);
    println!("✅ Task retrieved successfully: {}", retrieved.title);

    // Update操作テスト
    let mut updated_task = task.clone();
    updated_task.title = "更新されたSQLiteタスク".to_string();
    updated_task.status = TaskStatus::InProgress;
    updated_task.priority = 1;
    updated_task.updated_at = Utc::now();

    task_repository.save(&updated_task).await?;
    let retrieved_updated = task_repository.find_by_id(&task_id).await?;
    assert!(retrieved_updated.is_some());
    let updated = retrieved_updated.unwrap();
    assert_eq!(updated.title, updated_task.title);
    assert_eq!(updated.status, TaskStatus::InProgress);
    println!("✅ Task updated successfully: {}", updated.title);

    // Delete操作テスト
    task_repository.delete(&task_id).await?;
    let deleted_check = task_repository.find_by_id(&task_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Task deleted successfully");

    // テスト結果を永続保存
    copy_to_persistent_storage(
        &std::env::temp_dir(),
        &persistent_dir,
        "test_task_repository_crud_operations",
    )?;

    println!("🎉 タスクリポジトリCRUD操作テスト完了");
    Ok(())
}

/// サブタスクリポジトリの基本CRUD操作テスト
#[tokio::test]
async fn test_subtask_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let persistent_dir = create_persistent_test_dir("test_subtask_repository_crud_operations");
    
    // データベースマネージャーを作成
    let db_manager = create_test_database_manager("subtask_crud").await?;
    
    let subtask_repository = SubtaskLocalSqliteRepository::new(db_manager.clone());
    let task_repository = TaskLocalSqliteRepository::new(db_manager.clone());
    let project_repository = ProjectLocalSqliteRepository::new(db_manager.clone());
    let task_list_repository = TaskListLocalSqliteRepository::new(db_manager);

    // 前提条件：プロジェクト、タスクリスト、タスクを作成
    let project_id = ProjectId::new();
    let project = Project {
        id: project_id.clone(),
        name: "SubTask Test Project".to_string(),
        description: Some("サブタスクテスト用プロジェクト".to_string()),
        color: Some("#555555".to_string()),
        order_index: 1,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    project_repository.save(&project).await?;

    let task_list_id = TaskListId::new();
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "サブタスクテスト用リスト".to_string(),
        description: None,
        color: None,
        order_index: 1,
        is_archived: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    task_list_repository.save(&task_list).await?;

    let task_id = TaskId::new();
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "親タスク".to_string(),
        description: Some("サブタスクの親タスク".to_string()),
        status: TaskStatus::NotStarted,
        priority: 3,
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
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    task_repository.save(&task).await?;

    // テスト用サブタスクデータを作成
    let subtask_id = SubTaskId::new();
    let subtask = SubTask {
        id: subtask_id.clone(),
        project_id: project_id.clone(),
        task_id: task_id.clone(),
        title: "SQLiteサブタスク".to_string(),
        description: Some("SQLiteテスト用サブタスク".to_string()),
        status: TaskStatus::NotStarted,
        priority: Some(1),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        tags: vec![],
        order_index: 1,
        completed: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    println!("Creating subtask: {:?}", subtask.title);

    // Create操作テスト
    subtask_repository.save(&subtask).await?;
    println!("✅ SubTask created successfully");

    // Read操作テスト
    let retrieved_subtask = subtask_repository.find_by_id(&subtask_id).await?;
    assert!(retrieved_subtask.is_some());
    let retrieved = retrieved_subtask.unwrap();
    assert_eq!(retrieved.title, subtask.title);
    assert_eq!(retrieved.task_id, subtask.task_id);
    println!("✅ SubTask retrieved successfully: {}", retrieved.title);

    // Update操作テスト
    let mut updated_subtask = subtask.clone();
    updated_subtask.title = "更新されたSQLiteサブタスク".to_string();
    updated_subtask.completed = true;
    updated_subtask.status = TaskStatus::Completed;
    updated_subtask.updated_at = Utc::now();

    subtask_repository.save(&updated_subtask).await?;
    let retrieved_updated = subtask_repository.find_by_id(&subtask_id).await?;
    assert!(retrieved_updated.is_some());
    let updated = retrieved_updated.unwrap();
    assert_eq!(updated.title, updated_subtask.title);
    assert!(updated.completed);
    println!("✅ SubTask updated successfully: {}", updated.title);

    // Delete操作テスト
    subtask_repository.delete(&subtask_id).await?;
    let deleted_check = subtask_repository.find_by_id(&subtask_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ SubTask deleted successfully");

    // テスト結果を永続保存
    copy_to_persistent_storage(
        &std::env::temp_dir(),
        &persistent_dir,
        "test_subtask_repository_crud_operations",
    )?;

    println!("🎉 サブタスクリポジトリCRUD操作テスト完了");
    Ok(())
}

/// タグリポジトリの基本CRUD操作テスト
#[tokio::test]
async fn test_tag_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let persistent_dir = create_persistent_test_dir("test_tag_repository_crud_operations");
    
    // データベースマネージャーを作成
    let db_manager = create_test_database_manager("tag_crud").await?;
    
    println!("🔧 TagLocalSqliteRepository作成中...");
    let tag_repository = TagLocalSqliteRepository::new(db_manager);
    println!("✅ TagLocalSqliteRepository作成完了");

    // テスト用タグデータを作成
    let tag_id = TagId::new();
    let tag = Tag {
        id: tag_id.clone(),
        name: "SQLiteタグ".to_string(),
        color: Some("#ff6b6b".to_string()),
        order_index: Some(1),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    println!("Creating tag: {:?}", tag.name);
    println!("🔍 デバッグ: データベースパス = {:?}", std::env::var("FLEQUIT_DB_PATH"));
    println!("🔍 デバッグ: タグID = {:?}", tag_id);

    // Create操作テスト  
    match tag_repository.save(&tag).await {
        Ok(_) => println!("✅ Tag created successfully"),
        Err(e) => {
            println!("❌ Tag save failed: {:?}", e);
            return Err(e.into());
        }
    };

    // Read操作テスト
    let retrieved_tag = tag_repository.find_by_id(&tag_id).await?;
    assert!(retrieved_tag.is_some());
    let retrieved = retrieved_tag.unwrap();
    assert_eq!(retrieved.name, tag.name);
    assert_eq!(retrieved.color, tag.color);
    println!("✅ Tag retrieved successfully: {}", retrieved.name);

    // Update操作テスト
    let mut updated_tag = tag.clone();
    updated_tag.name = "更新されたSQLiteタグ".to_string();
    updated_tag.color = Some("#4ecdc4".to_string());
    updated_tag.order_index = Some(2);
    updated_tag.updated_at = Utc::now();

    tag_repository.save(&updated_tag).await?;
    let retrieved_updated = tag_repository.find_by_id(&tag_id).await?;
    assert!(retrieved_updated.is_some());
    let updated = retrieved_updated.unwrap();
    assert_eq!(updated.name, updated_tag.name);
    assert_eq!(updated.color, updated_tag.color);
    println!("✅ Tag updated successfully: {}", updated.name);

    // Delete操作テスト
    tag_repository.delete(&tag_id).await?;
    let deleted_check = tag_repository.find_by_id(&tag_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Tag deleted successfully");

    // データベースファイルを結果フォルダにコピー（検査用）
    let current_db_path = std::env::var("FLEQUIT_DB_PATH").unwrap_or_default();
    if !current_db_path.is_empty() && std::path::Path::new(&current_db_path).exists() {
        let dest_db_path = persistent_dir.join("test_database.db");
        std::fs::copy(&current_db_path, &dest_db_path)?;
        println!("💾 データベースファイルをコピー: {}", dest_db_path.display());
        println!("📊 最終データベースサイズ: {} bytes", std::fs::metadata(&dest_db_path)?.len());
    }

    // テスト結果を永続保存
    copy_to_persistent_storage(
        &std::env::temp_dir(),
        &persistent_dir,
        "test_tag_repository_crud_operations",
    )?;

    println!("🎉 タグリポジトリCRUD操作テスト完了");
    Ok(())
}

/// 複数エンティティの連携テスト
#[tokio::test]
async fn test_multiple_entities_integration() -> Result<(), Box<dyn std::error::Error>> {
    let persistent_dir = create_persistent_test_dir("test_multiple_entities_integration");
    
    // データベースマネージャーを作成
    let db_manager = create_test_database_manager("multiple_entities").await?;
    
    let project_repo = ProjectLocalSqliteRepository::new(db_manager.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager.clone());
    let subtask_repo = SubtaskLocalSqliteRepository::new(db_manager.clone());
    let tag_repo = TagLocalSqliteRepository::new(db_manager.clone());

    // プロジェクト作成
    let project_id = ProjectId::new();
    let project = Project {
        id: project_id.clone(),
        name: "総合連携テストプロジェクト".to_string(),
        description: Some("全エンティティの連携テスト".to_string()),
        color: Some("#8b5cf6".to_string()),
        order_index: 1,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    project_repo.save(&project).await?;
    println!("✅ プロジェクト作成完了");

    // タスクリスト作成
    let task_list_id = TaskListId::new();
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "連携テスト用タスクリスト".to_string(),
        description: Some("全エンティティ連携テスト用".to_string()),
        color: Some("#06d6a0".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    task_list_repo.save(&task_list).await?;
    println!("✅ タスクリスト作成完了");

    // タグ作成
    let tag_id = TagId::new();
    let tag = Tag {
        id: tag_id.clone(),
        name: "重要".to_string(),
        color: Some("#ef476f".to_string()),
        order_index: Some(1),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    tag_repo.save(&tag).await?;
    println!("✅ タグ作成完了");

    // タスク作成
    let task_id = TaskId::new();
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        sub_task_id: None,
        list_id: task_list_id.clone(),
        title: "連携テストタスク".to_string(),
        description: Some("全エンティティ連携テスト用タスク".to_string()),
        status: TaskStatus::NotStarted,
        priority: 1,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![tag_id.clone()],
        order_index: 1,
        is_archived: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    task_repo.save(&task).await?;
    println!("✅ タスク作成完了");

    // サブタスク作成
    let subtask_id = SubTaskId::new();
    let subtask = SubTask {
        id: subtask_id.clone(),
        project_id: project_id.clone(),
        task_id: task_id.clone(),
        title: "連携テストサブタスク".to_string(),
        description: Some("全エンティティ連携テスト用サブタスク".to_string()),
        status: TaskStatus::NotStarted,
        priority: Some(1),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        tags: vec![],
        order_index: 1,
        completed: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    subtask_repo.save(&subtask).await?;
    println!("✅ サブタスク作成完了");

    // 全データの存在確認
    let retrieved_project = project_repo.find_by_id(&project_id).await?;
    let retrieved_task_list = task_list_repo.find_by_id(&task_list_id).await?;
    let retrieved_task = task_repo.find_by_id(&task_id).await?;
    let retrieved_subtask = subtask_repo.find_by_id(&subtask_id).await?;
    let retrieved_tag = tag_repo.find_by_id(&tag_id).await?;

    assert!(retrieved_project.is_some());
    assert!(retrieved_task_list.is_some());
    assert!(retrieved_task.is_some());
    assert!(retrieved_subtask.is_some());
    assert!(retrieved_tag.is_some());
    println!("✅ 全エンティティの取得確認完了");

    // 関連性の確認
    let project = retrieved_project.unwrap();
    let task_list = retrieved_task_list.unwrap();
    let task = retrieved_task.unwrap();
    let subtask = retrieved_subtask.unwrap();

    assert_eq!(task_list.project_id, project.id);
    assert_eq!(task.project_id, project.id);
    assert_eq!(task.list_id, task_list.id);
    assert_eq!(subtask.task_id, task.id);
    assert_eq!(task.tag_ids, vec![tag_id]);
    println!("✅ エンティティ間の関連性確認完了");

    // 削除の連鎖テスト（子から親へ）
    subtask_repo.delete(&subtask_id).await?;
    let deleted_subtask = subtask_repo.find_by_id(&subtask_id).await?;
    assert!(deleted_subtask.is_none());
    println!("✅ サブタスク削除完了");

    task_repo.delete(&task_id).await?;
    let deleted_task = task_repo.find_by_id(&task_id).await?;
    assert!(deleted_task.is_none());
    println!("✅ タスク削除完了");

    task_list_repo.delete(&task_list_id).await?;
    let deleted_task_list = task_list_repo.find_by_id(&task_list_id).await?;
    assert!(deleted_task_list.is_none());
    println!("✅ タスクリスト削除完了");

    project_repo.delete(&project_id).await?;
    let deleted_project = project_repo.find_by_id(&project_id).await?;
    assert!(deleted_project.is_none());
    println!("✅ プロジェクト削除完了");

    tag_repo.delete(&tag_id).await?;
    let deleted_tag = tag_repo.find_by_id(&tag_id).await?;
    assert!(deleted_tag.is_none());
    println!("✅ タグ削除完了");

    // テスト結果を永続保存
    copy_to_persistent_storage(
        &std::env::temp_dir(),
        &persistent_dir,
        "test_multiple_entities_integration",
    )?;

    println!("🎉 複数エンティティ連携テスト完了");
    Ok(())
}