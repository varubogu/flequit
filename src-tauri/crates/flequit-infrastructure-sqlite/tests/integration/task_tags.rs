//! タスク-タグ紐づけテーブルテスト
//!
//! testing.mdルール準拠のSQLiteタスクタグリポジトリテスト

use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    project::ProjectLocalSqliteRepository, tag::TagLocalSqliteRepository,
    task::TaskLocalSqliteRepository, task_list::TaskListLocalSqliteRepository,
    task_tag::TaskTagLocalSqliteRepository,
};
use flequit_model::models::task_projects::{
    project::Project, tag::Tag, task::Task, task_list::TaskList,
};
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, TaskListId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use flequit_model::types::task_types::TaskStatus;
use flequit_repository::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::base_repository_trait::Repository;
use function_name::named;
use std::sync::Arc;
use uuid::Uuid;

use flequit_testing::TestPathGenerator;

use crate::integration::support::sqlite::SqliteTestHarness;

#[named]
#[tokio::test]
async fn test_task_tag_relation_operations() -> Result<(), Box<dyn std::error::Error>> {
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
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc.clone());
    let task_tag_repo = TaskTagLocalSqliteRepository::new(db_manager_arc);

    // テストデータ作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "TaskTag紐づけテスト用プロジェクト".to_string(),
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

    let task_list_id = TaskListId::from(Uuid::new_v4());
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "TaskTag紐づけテスト用タスクリスト".to_string(),
        description: None,
        color: None,
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    task_list_repo
        .save(&task_list.project_id, &task_list)
        .await?;

    let task_id = TaskId::from(Uuid::new_v4());
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "TaskTag紐づけテスト用タスク".to_string(),
        description: None,
        status: TaskStatus::NotStarted,
        priority: 1,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![], // 初期状態では空
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    task_repo.save(&task.project_id, &task).await?;

    // テスト用タグ作成
    let tag1_id = TagId::from(Uuid::new_v4());
    let tag1 = Tag {
        id: tag1_id.clone(),
        name: "重要".to_string(),
        color: Some("#F44336".to_string()),
        order_index: Some(1),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    tag_repo.save(&project_id, &tag1).await?;

    let tag2_id = TagId::from(Uuid::new_v4());
    let tag2 = Tag {
        id: tag2_id.clone(),
        name: "急務".to_string(),
        color: Some("#FF9800".to_string()),
        order_index: Some(2),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    tag_repo.save(&project_id, &tag2).await?;

    // 1. タスクとタグの関連付け追加テスト
    task_tag_repo
        .add_relation(&project_id, &task_id, &tag1_id)
        .await?;
    task_tag_repo
        .add_relation(&project_id, &task_id, &tag2_id)
        .await?;

    // 2. タスクのタグ取得テスト
    let task_tags = task_tag_repo
        .find_tag_ids_by_task_id(&project_id, &task_id)
        .await?;
    assert_eq!(task_tags.len(), 2);
    assert!(task_tags.contains(&tag1_id));
    assert!(task_tags.contains(&tag2_id));

    // 3. タグからタスクを検索テスト
    let tasks_with_tag1 = task_tag_repo
        .find_task_ids_by_tag_id(&project_id, &tag1_id)
        .await?;
    assert_eq!(tasks_with_tag1.len(), 1);
    assert_eq!(tasks_with_tag1[0], task_id);

    // 4. 重複登録防止テスト
    task_tag_repo
        .add_relation(&project_id, &task_id, &tag1_id)
        .await?; // 既存の関連を再追加
    let task_tags_after_duplicate = task_tag_repo
        .find_tag_ids_by_task_id(&project_id, &task_id)
        .await?;
    assert_eq!(task_tags_after_duplicate.len(), 2); // 重複していない

    // 5. 個別削除テスト
    task_tag_repo
        .remove_relation(&project_id, &task_id, &tag1_id)
        .await?;
    let task_tags_after_remove = task_tag_repo
        .find_tag_ids_by_task_id(&project_id, &task_id)
        .await?;
    assert_eq!(task_tags_after_remove.len(), 1);
    assert_eq!(task_tags_after_remove[0], tag2_id);

    // 6. 全削除テスト
    task_tag_repo
        .remove_all_relations_by_task_id(&project_id, &task_id)
        .await?;
    let task_tags_after_clear = task_tag_repo
        .find_tag_ids_by_task_id(&project_id, &task_id)
        .await?;
    assert_eq!(task_tags_after_clear.len(), 0);

    println!("✅ TaskTagリポジトリテスト完了");
    Ok(())
}

#[named]
#[tokio::test]
async fn test_task_tag_bulk_update() -> Result<(), Box<dyn std::error::Error>> {
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
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc.clone());
    let task_tag_repo = TaskTagLocalSqliteRepository::new(db_manager_arc.clone());

    // テストデータ作成
    let project_id = ProjectId::from(Uuid::new_v4());
    let project = Project {
        id: project_id.clone(),
        name: "TaskTag一括更新テスト用プロジェクト".to_string(),
        description: None,
        color: Some("#9C27B0".to_string()),
        order_index: 1,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    project_repo.save(&project).await?;

    let task_list_id = TaskListId::from(Uuid::new_v4());
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "一括更新テスト用タスクリスト".to_string(),
        description: None,
        color: None,
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    task_list_repo
        .save(&task_list.project_id, &task_list)
        .await?;

    let task_id = TaskId::from(Uuid::new_v4());
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "一括更新テスト用タスク".to_string(),
        description: None,
        status: TaskStatus::NotStarted,
        priority: 1,
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
    task_repo.save(&task.project_id, &task).await?;

    // テスト用タグ作成
    let mut tag_ids = Vec::new();
    for i in 1..=3 {
        let tag_id = TagId::from(Uuid::new_v4());
        let tag = Tag {
            id: tag_id.clone(),
            name: format!("テストタグ{}", i),
            color: None,
            order_index: Some(i),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };
        tag_repo.save(&project_id, &tag).await?;
        tag_ids.push(tag_id);
    }

    // データベース接続を取得してトランザクションテスト
    let db_manager_read = db_manager_arc.read().await;
    let db = db_manager_read.get_connection().await?;

    // 一括更新テスト
    task_tag_repo
        .update_task_tag_relations(db, &project_id, &task_id, &tag_ids)
        .await?;
    drop(db_manager_read); // 読み取りロックを解放

    // 結果確認
    let assigned_tags = task_tag_repo
        .find_tag_ids_by_task_id(&project_id, &task_id)
        .await?;
    assert_eq!(assigned_tags.len(), 3);
    for tag_id in &tag_ids {
        assert!(assigned_tags.contains(tag_id));
    }

    println!("✅ TaskTag一括更新テスト完了");
    Ok(())
}
