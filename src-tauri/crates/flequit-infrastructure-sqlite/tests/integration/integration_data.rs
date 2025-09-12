//! SQLite統合テスト
//!
//! 複数エンティティにわたる統合テスト

use flequit_infrastructure_sqlite::infrastructure::database_manager::DatabaseManager;
use flequit_infrastructure_sqlite::infrastructure::task_projects::{
    project::ProjectLocalSqliteRepository, subtask::SubTaskLocalSqliteRepository,
    tag::TagLocalSqliteRepository, task::TaskLocalSqliteRepository,
    task_list::TaskListLocalSqliteRepository,
};
use flequit_model::models::{
    task_projects::project::Project, task_projects::subtask::SubTask, task_projects::tag::Tag,
    task_projects::task::Task, task_projects::task_list::TaskList,
};
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId, TaskId, TaskListId, UserId};
use flequit_model::types::project_types::ProjectStatus;
use flequit_model::types::task_types::TaskStatus;
use flequit_repository::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::base_repository_trait::Repository;
use std::sync::Arc;
use uuid::Uuid;

use ::function_name::named;
use flequit_testing::TestPathGenerator;

use crate::integration::support::sqlite::SqliteTestHarness;

#[named]
#[tokio::test]
async fn test_multiple_entities_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    // テンプレートディレクトリ
    let crate_name = env!("CARGO_PKG_NAME");
    let template_dir = TestPathGenerator::generate_test_crate_dir(crate_name);

    // テストデータベースを作成
    let test_case = function_name!();
    let output_dir = TestPathGenerator::generate_test_dir(file!(), test_case);
    let output_file_path = SqliteTestHarness::copy_database_template(&template_dir, &output_dir)?;

    // リポジトリを初期化
    let db_manager = DatabaseManager::new_for_test(output_file_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));

    let project_repo = ProjectLocalSqliteRepository::new(db_manager_arc.clone());
    let task_list_repo = TaskListLocalSqliteRepository::new(db_manager_arc.clone());
    let task_repo = TaskLocalSqliteRepository::new(db_manager_arc.clone());
    let subtask_repo = SubTaskLocalSqliteRepository::new(db_manager_arc.clone());
    let tag_repo = TagLocalSqliteRepository::new(db_manager_arc);

    // === プロジェクトを2件作成 ===
    let project_id1 = ProjectId::from(Uuid::new_v4());
    let project1 = Project {
        id: project_id1.clone(),
        name: "マルチエンティティテストプロジェクト1".to_string(),
        description: Some("複数エンティティテスト用プロジェクト1".to_string()),
        color: Some("#FF5722".to_string()),
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
        name: "マルチエンティティテストプロジェクト2".to_string(),
        description: Some("複数エンティティテスト用プロジェクト2".to_string()),
        color: Some("#607D8B".to_string()),
        order_index: 2,
        is_archived: false,
        status: Some(ProjectStatus::Active),
        owner_id: Some(UserId::from(Uuid::new_v4())),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    project_repo.save(&project1).await?;
    project_repo.save(&project2).await?;

    // プロジェクト取得確認
    let retrieved_project1 = project_repo.find_by_id(&project_id1).await?;
    let retrieved_project2 = project_repo.find_by_id(&project_id2).await?;
    assert!(retrieved_project1.is_some());
    assert!(retrieved_project2.is_some());
    assert_eq!(retrieved_project1.unwrap().name, project1.name);
    assert_eq!(retrieved_project2.unwrap().name, project2.name);

    // === タスクリストを2件作成 ===
    let task_list_id1 = TaskListId::from(Uuid::new_v4());
    let task_list1 = TaskList {
        id: task_list_id1.clone(),
        project_id: project_id1.clone(),
        name: "マルチエンティティテストリスト1".to_string(),
        description: Some("複数エンティティテスト用タスクリスト1".to_string()),
        color: Some("#795548".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let task_list_id2 = TaskListId::from(Uuid::new_v4());
    let task_list2 = TaskList {
        id: task_list_id2.clone(),
        project_id: project_id2.clone(),
        name: "マルチエンティティテストリスト2".to_string(),
        description: Some("複数エンティティテスト用タスクリスト2".to_string()),
        color: Some("#009688".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    task_list_repo
        .save(&task_list1.project_id, &task_list1)
        .await?;
    task_list_repo
        .save(&task_list2.project_id, &task_list2)
        .await?;

    // タスクリスト取得確認
    let retrieved_task_list1 = task_list_repo
        .find_by_id(&task_list1.project_id, &task_list_id1)
        .await?;
    let retrieved_task_list2 = task_list_repo
        .find_by_id(&task_list2.project_id, &task_list_id2)
        .await?;
    assert!(retrieved_task_list1.is_some());
    assert!(retrieved_task_list2.is_some());
    assert_eq!(retrieved_task_list1.unwrap().name, task_list1.name);
    assert_eq!(retrieved_task_list2.unwrap().name, task_list2.name);

    // === タスクを2件作成 ===

    let task_id1 = TaskId::from(Uuid::new_v4());
    let task1 = Task {
        id: task_id1.clone(),
        project_id: project_id1.clone(),
        list_id: task_list_id1.clone(),
        title: "マルチエンティティテストタスク1".to_string(),
        description: Some("複数エンティティテスト用タスク1".to_string()),
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
        project_id: project_id2.clone(),
        list_id: task_list_id2.clone(),
        title: "マルチエンティティテストタスク2".to_string(),
        description: Some("複数エンティティテスト用タスク2".to_string()),
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
        order_index: 1,
        is_archived: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    task_repo.save(&task1.project_id, &task1).await?;
    task_repo.save(&task2.project_id, &task2).await?;

    // タスク取得確認
    let retrieved_task1 = task_repo.find_by_id(&task1.project_id, &task_id1).await?;
    let retrieved_task2 = task_repo.find_by_id(&task2.project_id, &task_id2).await?;
    assert!(retrieved_task1.is_some());
    assert!(retrieved_task2.is_some());
    assert_eq!(retrieved_task1.unwrap().title, task1.title);
    assert_eq!(retrieved_task2.unwrap().title, task2.title);

    // === サブタスクを2件作成 ===
    let subtask_id1 = SubTaskId::from(Uuid::new_v4());
    let subtask1 = SubTask {
        id: subtask_id1.clone(),
        task_id: task_id1.clone(),
        title: "マルチエンティティテストサブタスク1".to_string(),
        description: Some("複数エンティティテスト用サブタスク1".to_string()),
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
        task_id: task_id2.clone(),
        title: "マルチエンティティテストサブタスク2".to_string(),
        description: Some("複数エンティティテスト用サブタスク2".to_string()),
        status: TaskStatus::Completed,
        priority: Some(1),
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: Some(chrono::Utc::now()),
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 1,
        completed: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    subtask_repo.save(&project_id1, &subtask1).await?;
    subtask_repo.save(&project_id2, &subtask2).await?;

    // サブタスク取得確認
    let retrieved_subtask1 = subtask_repo.find_by_id(&project_id1, &subtask_id1).await?;
    let retrieved_subtask2 = subtask_repo.find_by_id(&project_id2, &subtask_id2).await?;
    assert!(retrieved_subtask1.is_some());
    assert!(retrieved_subtask2.is_some());
    assert_eq!(retrieved_subtask1.unwrap().title, subtask1.title);
    assert_eq!(retrieved_subtask2.unwrap().title, subtask2.title);

    // === タグを2件作成 ===
    let tag_id1 = TagId::from(Uuid::new_v4());
    let tag1 = Tag {
        id: tag_id1.clone(),
        name: "マルチエンティティテストタグ1".to_string(),
        color: Some("#F44336".to_string()),
        order_index: Some(1),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let tag_id2 = TagId::from(Uuid::new_v4());
    let tag2 = Tag {
        id: tag_id2.clone(),
        name: "マルチエンティティテストタグ2".to_string(),
        color: Some("#3F51B5".to_string()),
        order_index: Some(2),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    tag_repo.save(&project_id1, &tag1).await?;
    tag_repo.save(&project_id2, &tag2).await?;

    // タグ取得確認
    let retrieved_tag1 = tag_repo.find_by_id(&project_id1, &tag_id1).await?;
    let retrieved_tag2 = tag_repo.find_by_id(&project_id2, &tag_id2).await?;
    assert!(retrieved_tag1.is_some());
    assert!(retrieved_tag2.is_some());
    assert_eq!(retrieved_tag1.unwrap().name, tag1.name);
    assert_eq!(retrieved_tag2.unwrap().name, tag2.name);

    // === 更新テスト ===
    // プロジェクト更新
    let mut updated_project1 = project1.clone();
    updated_project1.name = "更新済みマルチエンティティテストプロジェクト1".to_string();
    project_repo.save(&updated_project1).await?;

    let retrieved_updated_project1 = project_repo.find_by_id(&project_id1).await?;
    assert!(retrieved_updated_project1.is_some());
    assert_eq!(
        retrieved_updated_project1.unwrap().name,
        updated_project1.name
    );

    // === 削除テスト ===
    // 逆順で削除（依存関係を考慮）
    tag_repo.delete(&project_id1, &tag_id1).await?;
    tag_repo.delete(&project_id2, &tag_id2).await?;

    subtask_repo.delete(&project_id1, &subtask_id1).await?;
    subtask_repo.delete(&project_id2, &subtask_id2).await?;

    task_repo.delete(&project_id1, &task_id1).await?;
    task_repo.delete(&project_id2, &task_id2).await?;

    task_list_repo.delete(&project_id1, &task_list_id1).await?;
    task_list_repo.delete(&project_id2, &task_list_id2).await?;

    project_repo.delete(&project_id1).await?;
    project_repo.delete(&project_id2).await?;

    // 削除確認
    assert!(project_repo.find_by_id(&project_id1).await?.is_none());
    assert!(project_repo.find_by_id(&project_id2).await?.is_none());
    assert!(task_list_repo
        .find_by_id(&project_id1, &task_list_id1)
        .await?
        .is_none());
    assert!(task_list_repo
        .find_by_id(&project_id2, &task_list_id2)
        .await?
        .is_none());
    assert!(task_repo
        .find_by_id(&project_id1, &task_id1)
        .await?
        .is_none());
    assert!(task_repo
        .find_by_id(&project_id2, &task_id2)
        .await?
        .is_none());
    assert!(subtask_repo
        .find_by_id(&project_id1, &subtask_id1)
        .await?
        .is_none());
    assert!(subtask_repo
        .find_by_id(&project_id2, &subtask_id2)
        .await?
        .is_none());
    assert!(tag_repo.find_by_id(&project_id1, &tag_id1).await?.is_none());
    assert!(tag_repo.find_by_id(&project_id2, &tag_id2).await?.is_none());

    println!("✅ 複数エンティティCRUD操作テスト完了");

    Ok(())
}
