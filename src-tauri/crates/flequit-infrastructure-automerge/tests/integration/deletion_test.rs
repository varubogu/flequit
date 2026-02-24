//! 論理削除・復元機能のテスト
//!
//! mark_project_deleted, create_snapshot, restore_from_snapshot,
//! get_active_*/get_deleted_*, restore_project, restore_all_* の動作を検証する

use chrono::Utc;
use flequit_infrastructure_automerge::infrastructure::task_projects::project::ProjectLocalAutomergeRepository;
use flequit_model::models::task_projects::project::Project;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::models::task_projects::task::Task;
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_model::traits::Trackable;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, TaskListId, UserId};
use flequit_model::types::task_types::TaskStatus;
use flequit_testing::TestPathGenerator;
use std::path::PathBuf;

// ========== テストヘルパー ==========

fn make_test_project(project_id: &ProjectId, user_id: &UserId) -> Project {
    let now = Utc::now();
    Project {
        id: project_id.clone(),
        name: "Test Project".to_string(),
        description: Some("deletion test".to_string()),
        color: None,
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: None,
        created_at: now,
        updated_at: now,
        deleted: false,
        updated_by: user_id.clone(),
    }
}

fn make_test_task(project_id: &ProjectId, task_list_id: &TaskListId, user_id: &UserId) -> Task {
    let now = Utc::now();
    Task {
        id: TaskId::new(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "Test Task".to_string(),
        description: None,
        status: TaskStatus::NotStarted,
        priority: 0,
        plan_start_date: None,
        plan_end_date: None,
        do_start_date: None,
        do_end_date: None,
        is_range_date: None,
        recurrence_rule: None,
        assigned_user_ids: vec![],
        tag_ids: vec![],
        order_index: 0,
        is_archived: false,
        created_at: now,
        updated_at: now,
        deleted: false,
        updated_by: user_id.clone(),
    }
}

fn make_test_tag(user_id: &UserId) -> Tag {
    let now = Utc::now();
    Tag {
        id: TagId::new(),
        name: "Test Tag".to_string(),
        color: None,
        order_index: None,
        created_at: now,
        updated_at: now,
        deleted: false,
        updated_by: user_id.clone(),
    }
}

fn make_test_task_list(project_id: &ProjectId, user_id: &UserId) -> TaskList {
    let now = Utc::now();
    TaskList {
        id: TaskListId::new(),
        project_id: project_id.clone(),
        name: "Test TaskList".to_string(),
        description: None,
        color: None,
        order_index: 0,
        is_archived: false,
        created_at: now,
        updated_at: now,
        deleted: false,
        updated_by: user_id.clone(),
    }
}

async fn create_repo(test_name: &str) -> (ProjectLocalAutomergeRepository, PathBuf) {
    let test_dir = TestPathGenerator::generate_test_dir(file!(), test_name);
    let automerge_dir = TestPathGenerator::create_automerge_dir(&test_dir).unwrap();
    let repo = ProjectLocalAutomergeRepository::new(automerge_dir.clone())
        .await
        .unwrap();
    (repo, automerge_dir)
}

// ========== Phase 1: 論理削除 ==========

/// mark_project_deleted が deleted=true、updated_by、updated_at を設定することを確認
#[tokio::test]
async fn test_mark_project_deleted_sets_deleted_flag() {
    let (repo, _) = create_repo("test_mark_project_deleted_sets_deleted_flag").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    // プロジェクトドキュメントを作成
    repo.create_empty_project_document(&project).await.unwrap();

    // 論理削除実行
    let delete_user = UserId::new();
    let timestamp = Utc::now();
    repo.mark_project_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();

    // deleted=true になっていることを確認
    let retrieved = repo.get_project(&project_id.to_string()).await.unwrap();
    let retrieved = retrieved.expect("Project should exist after deletion");

    assert!(retrieved.deleted, "deleted flag should be true after mark_project_deleted");
    assert_eq!(
        retrieved.updated_by, delete_user,
        "updated_by should be set to the deleting user"
    );
}

/// 存在しないプロジェクトを論理削除しようとするとエラーになることを確認
#[tokio::test]
async fn test_mark_project_deleted_not_found() {
    let (repo, _) = create_repo("test_mark_project_deleted_not_found").await;
    let user_id = UserId::new();
    let non_existent_id = ProjectId::new();
    let timestamp = Utc::now();

    let result = repo
        .mark_project_deleted(&non_existent_id, &user_id, &timestamp)
        .await;

    assert!(result.is_err(), "Should return error for non-existent project");
}

// ========== Phase 2: スナップショット ==========

/// create_snapshot が現在のドキュメントのクローンを返すことを確認
#[tokio::test]
async fn test_create_snapshot_returns_clone() {
    let (repo, _) = create_repo("test_create_snapshot_returns_clone").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // スナップショット作成
    let snapshot = repo.create_snapshot(&project_id).await.unwrap();

    assert_eq!(snapshot.id, project_id.to_string());
    assert_eq!(snapshot.name, "Test Project");
    assert!(!snapshot.deleted, "Snapshot should reflect non-deleted state");
}

/// restore_from_snapshot がドキュメントを復元することを確認
#[tokio::test]
async fn test_restore_from_snapshot() {
    let (repo, _) = create_repo("test_restore_from_snapshot").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // 削除前のスナップショットを保存
    let snapshot = repo.create_snapshot(&project_id).await.unwrap();

    // 論理削除を実行
    let timestamp = Utc::now();
    repo.mark_project_deleted(&project_id, &user_id, &timestamp)
        .await
        .unwrap();

    // 削除後は deleted=true
    let after_delete = repo
        .get_project(&project_id.to_string())
        .await
        .unwrap()
        .unwrap();
    assert!(after_delete.deleted, "Should be deleted before restore");

    // スナップショットから復元
    repo.restore_from_snapshot(&project_id, &snapshot)
        .await
        .unwrap();

    // 復元後は deleted=false に戻っていること
    let after_restore = repo
        .get_project(&project_id.to_string())
        .await
        .unwrap()
        .unwrap();
    assert!(
        !after_restore.deleted,
        "Should not be deleted after snapshot restore"
    );
}

/// スナップショットにはタスク・タグ・タスクリストの状態も含まれることを確認
#[tokio::test]
async fn test_snapshot_includes_child_entities() {
    let (repo, _) = create_repo("test_snapshot_includes_child_entities").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // タスクリストとタスクを追加
    let task_list = make_test_task_list(&project_id, &user_id);
    let task = make_test_task(&project_id, &task_list.id, &user_id);
    let tag = make_test_tag(&user_id);

    repo.add_task_list(&project_id, &task_list).await.unwrap();
    repo.add_task(&project_id, &task).await.unwrap();
    repo.add_tag(&project_id, &tag).await.unwrap();

    // スナップショット作成
    let snapshot = repo.create_snapshot(&project_id).await.unwrap();

    assert_eq!(snapshot.task_lists.len(), 1, "Snapshot should include task lists");
    assert_eq!(snapshot.tasks.len(), 1, "Snapshot should include tasks");
    assert_eq!(snapshot.tags.len(), 1, "Snapshot should include tags");
}

// ========== Phase 3: クエリフィルタ ==========

/// get_active_tasks が deleted=false のタスクのみ返すことを確認
#[tokio::test]
async fn test_get_active_tasks_filters_deleted() {
    let (repo, _) = create_repo("test_get_active_tasks_filters_deleted").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    let task_list = make_test_task_list(&project_id, &user_id);
    repo.add_task_list(&project_id, &task_list).await.unwrap();

    // アクティブなタスクと削除済みタスクを追加
    let active_task = make_test_task(&project_id, &task_list.id, &user_id);
    let mut deleted_task = make_test_task(&project_id, &task_list.id, &user_id);
    deleted_task.title = "Deleted Task".to_string();
    let timestamp = Utc::now();
    deleted_task.mark_deleted(user_id.clone(), timestamp);

    repo.add_task(&project_id, &active_task).await.unwrap();
    repo.add_task(&project_id, &deleted_task).await.unwrap();

    // get_active_tasks は削除済みを含まない
    let active_tasks = repo.get_active_tasks(&project_id).await.unwrap();
    assert_eq!(active_tasks.len(), 1, "Should only return non-deleted tasks");
    assert_eq!(active_tasks[0].title, "Test Task");

    // get_deleted_tasks は削除済みのみ
    let deleted_tasks = repo.get_deleted_tasks(&project_id).await.unwrap();
    assert_eq!(deleted_tasks.len(), 1, "Should only return deleted tasks");
    assert_eq!(deleted_tasks[0].title, "Deleted Task");
}

/// get_active_tags が deleted=false のタグのみ返すことを確認
#[tokio::test]
async fn test_get_active_tags_filters_deleted() {
    let (repo, _) = create_repo("test_get_active_tags_filters_deleted").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // アクティブなタグと削除済みタグを追加
    let active_tag = make_test_tag(&user_id);
    let mut deleted_tag = make_test_tag(&user_id);
    deleted_tag.name = "Deleted Tag".to_string();
    let timestamp = Utc::now();
    deleted_tag.mark_deleted(user_id.clone(), timestamp);

    repo.add_tag(&project_id, &active_tag).await.unwrap();
    repo.add_tag(&project_id, &deleted_tag).await.unwrap();

    // get_active_tags は削除済みを含まない
    let active_tags = repo.get_active_tags(&project_id).await.unwrap();
    assert_eq!(active_tags.len(), 1, "Should only return non-deleted tags");
    assert_eq!(active_tags[0].name, "Test Tag");

    // get_deleted_tags は削除済みのみ
    let deleted_tags = repo.get_deleted_tags(&project_id).await.unwrap();
    assert_eq!(deleted_tags.len(), 1, "Should only return deleted tags");
    assert_eq!(deleted_tags[0].name, "Deleted Tag");
}

/// get_active_task_lists が deleted=false のタスクリストのみ返すことを確認
#[tokio::test]
async fn test_get_active_task_lists_filters_deleted() {
    let (repo, _) = create_repo("test_get_active_task_lists_filters_deleted").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // アクティブなタスクリストと削除済みタスクリストを追加
    let active_list = make_test_task_list(&project_id, &user_id);
    let mut deleted_list = make_test_task_list(&project_id, &user_id);
    deleted_list.name = "Deleted TaskList".to_string();
    let timestamp = Utc::now();
    deleted_list.mark_deleted(user_id.clone(), timestamp);

    repo.add_task_list(&project_id, &active_list).await.unwrap();
    repo.add_task_list(&project_id, &deleted_list).await.unwrap();

    // get_active_task_lists は削除済みを含まない
    let active_lists = repo.get_active_task_lists(&project_id).await.unwrap();
    assert_eq!(active_lists.len(), 1, "Should only return non-deleted task lists");
    assert_eq!(active_lists[0].name, "Test TaskList");

    // get_deleted_task_lists は削除済みのみ
    let deleted_lists = repo.get_deleted_task_lists(&project_id).await.unwrap();
    assert_eq!(deleted_lists.len(), 1, "Should only return deleted task lists");
    assert_eq!(deleted_lists[0].name, "Deleted TaskList");
}

/// get_deleted_project が deleted=true のプロジェクトのみ返すことを確認
#[tokio::test]
async fn test_get_deleted_project() {
    let (repo, _) = create_repo("test_get_deleted_project").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // 削除前は None を返す
    let before_delete = repo.get_deleted_project(&project_id).await.unwrap();
    assert!(
        before_delete.is_none(),
        "Should return None for non-deleted project"
    );

    // 論理削除後は Some を返す
    let timestamp = Utc::now();
    repo.mark_project_deleted(&project_id, &user_id, &timestamp)
        .await
        .unwrap();

    let after_delete = repo.get_deleted_project(&project_id).await.unwrap();
    assert!(
        after_delete.is_some(),
        "Should return Some for deleted project"
    );
    assert!(after_delete.unwrap().deleted);
}

// ========== Phase 4: 復元機能 ==========

/// restore_project が deleted=false に戻ることを確認
#[tokio::test]
async fn test_restore_project() {
    let (repo, _) = create_repo("test_restore_project").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // 論理削除
    let delete_user = UserId::new();
    let delete_time = Utc::now();
    repo.mark_project_deleted(&project_id, &delete_user, &delete_time)
        .await
        .unwrap();

    // 削除後確認
    let deleted = repo.get_project(&project_id.to_string()).await.unwrap().unwrap();
    assert!(deleted.deleted);

    // 復元
    let restore_user = UserId::new();
    let restore_time = Utc::now();
    repo.restore_project(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();

    // 復元後は deleted=false、updated_by が restore_user になる
    let restored = repo.get_project(&project_id.to_string()).await.unwrap().unwrap();
    assert!(!restored.deleted, "deleted flag should be false after restore_project");
    assert_eq!(
        restored.updated_by, restore_user,
        "updated_by should be set to the restoring user"
    );
}

/// 削除されていないプロジェクトを restore_project しようとするとエラーになることを確認
#[tokio::test]
async fn test_restore_project_not_deleted_returns_error() {
    let (repo, _) = create_repo("test_restore_project_not_deleted_returns_error").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // 削除していないプロジェクトの復元は失敗する
    let timestamp = Utc::now();
    let result = repo.restore_project(&project_id, &user_id, &timestamp).await;

    assert!(
        result.is_err(),
        "Should return error when trying to restore non-deleted project"
    );
}

/// restore_all_tasks が削除済みタスクを復元することを確認
#[tokio::test]
async fn test_restore_all_tasks() {
    let (repo, _) = create_repo("test_restore_all_tasks").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    let task_list = make_test_task_list(&project_id, &user_id);
    repo.add_task_list(&project_id, &task_list).await.unwrap();

    // 削除済みタスクを2つ追加
    let mut task1 = make_test_task(&project_id, &task_list.id, &user_id);
    task1.title = "Task 1".to_string();
    let mut task2 = make_test_task(&project_id, &task_list.id, &user_id);
    task2.title = "Task 2".to_string();

    let delete_time = Utc::now();
    task1.mark_deleted(user_id.clone(), delete_time);
    task2.mark_deleted(user_id.clone(), delete_time);

    repo.add_task(&project_id, &task1).await.unwrap();
    repo.add_task(&project_id, &task2).await.unwrap();

    // 削除済みタスクが2つあることを確認
    let deleted_before = repo.get_deleted_tasks(&project_id).await.unwrap();
    assert_eq!(deleted_before.len(), 2, "Should have 2 deleted tasks");

    // 全タスクを復元
    let restore_user = UserId::new();
    let restore_time = Utc::now();
    repo.restore_all_tasks(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();

    // アクティブなタスクが2つになり、削除済みが0になることを確認
    let active_after = repo.get_active_tasks(&project_id).await.unwrap();
    assert_eq!(active_after.len(), 2, "Should have 2 active tasks after restore");

    let deleted_after = repo.get_deleted_tasks(&project_id).await.unwrap();
    assert_eq!(deleted_after.len(), 0, "Should have 0 deleted tasks after restore");
}

/// restore_all_tags が削除済みタグを復元することを確認
#[tokio::test]
async fn test_restore_all_tags() {
    let (repo, _) = create_repo("test_restore_all_tags").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // 削除済みタグを1つ追加
    let mut tag = make_test_tag(&user_id);
    let delete_time = Utc::now();
    tag.mark_deleted(user_id.clone(), delete_time);
    repo.add_tag(&project_id, &tag).await.unwrap();

    // 削除済みタグが1つあることを確認
    let deleted_before = repo.get_deleted_tags(&project_id).await.unwrap();
    assert_eq!(deleted_before.len(), 1);

    // 全タグを復元
    let restore_user = UserId::new();
    let restore_time = Utc::now();
    repo.restore_all_tags(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();

    // アクティブなタグが1つになり、削除済みが0になることを確認
    let active_after = repo.get_active_tags(&project_id).await.unwrap();
    assert_eq!(active_after.len(), 1, "Should have 1 active tag after restore");

    let deleted_after = repo.get_deleted_tags(&project_id).await.unwrap();
    assert_eq!(deleted_after.len(), 0, "Should have 0 deleted tags after restore");
}

/// restore_all_task_lists が削除済みタスクリストを復元することを確認
#[tokio::test]
async fn test_restore_all_task_lists() {
    let (repo, _) = create_repo("test_restore_all_task_lists").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // 削除済みタスクリストを1つ追加
    let mut task_list = make_test_task_list(&project_id, &user_id);
    let delete_time = Utc::now();
    task_list.mark_deleted(user_id.clone(), delete_time);
    repo.add_task_list(&project_id, &task_list).await.unwrap();

    // 削除済みタスクリストが1つあることを確認
    let deleted_before = repo.get_deleted_task_lists(&project_id).await.unwrap();
    assert_eq!(deleted_before.len(), 1);

    // 全タスクリストを復元
    let restore_user = UserId::new();
    let restore_time = Utc::now();
    repo.restore_all_task_lists(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();

    // アクティブが1つになり、削除済みが0になることを確認
    let active_after = repo.get_active_task_lists(&project_id).await.unwrap();
    assert_eq!(active_after.len(), 1);

    let deleted_after = repo.get_deleted_task_lists(&project_id).await.unwrap();
    assert_eq!(deleted_after.len(), 0);
}

// ========== 統合テスト: 削除→復元フロー ==========

/// プロジェクト削除→復元の完全フロー
#[tokio::test]
async fn test_full_delete_restore_flow() {
    let (repo, _) = create_repo("test_full_delete_restore_flow").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    // 1. プロジェクト作成
    repo.create_empty_project_document(&project).await.unwrap();

    let task_list = make_test_task_list(&project_id, &user_id);
    repo.add_task_list(&project_id, &task_list).await.unwrap();

    let task = make_test_task(&project_id, &task_list.id, &user_id);
    repo.add_task(&project_id, &task).await.unwrap();

    let tag = make_test_tag(&user_id);
    repo.add_tag(&project_id, &tag).await.unwrap();

    // 2. スナップショット作成
    let snapshot = repo.create_snapshot(&project_id).await.unwrap();
    assert!(!snapshot.deleted);

    // 3. 論理削除
    let delete_time = Utc::now();
    repo.mark_project_deleted(&project_id, &user_id, &delete_time)
        .await
        .unwrap();

    let deleted_project = repo.get_deleted_project(&project_id).await.unwrap();
    assert!(deleted_project.is_some(), "Project should be retrievable as deleted");

    // 4. 復元（restore_project）
    let restore_time = Utc::now();
    repo.restore_project(&project_id, &user_id, &restore_time)
        .await
        .unwrap();

    let restored = repo.get_project(&project_id.to_string()).await.unwrap().unwrap();
    assert!(!restored.deleted, "Project should be active after restore");

    // 5. get_deleted_project は復元後 None を返す
    let after_restore = repo.get_deleted_project(&project_id).await.unwrap();
    assert!(
        after_restore.is_none(),
        "get_deleted_project should return None after restore"
    );
}

/// スナップショット復元により子エンティティの状態も戻ることを確認
#[tokio::test]
async fn test_snapshot_restore_preserves_child_entities() {
    let (repo, _) = create_repo("test_snapshot_restore_preserves_child_entities").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    let task_list = make_test_task_list(&project_id, &user_id);
    repo.add_task_list(&project_id, &task_list).await.unwrap();

    let task = make_test_task(&project_id, &task_list.id, &user_id);
    let task_id = task.id.clone();
    repo.add_task(&project_id, &task).await.unwrap();

    // スナップショット（タスク1件）
    let snapshot = repo.create_snapshot(&project_id).await.unwrap();
    assert_eq!(snapshot.tasks.len(), 1);

    // もう1件タスクを追加
    let task2 = make_test_task(&project_id, &task_list.id, &user_id);
    repo.add_task(&project_id, &task2).await.unwrap();

    let before_restore = repo.get_active_tasks(&project_id).await.unwrap();
    assert_eq!(before_restore.len(), 2, "Should have 2 tasks before restore");

    // スナップショットから復元
    repo.restore_from_snapshot(&project_id, &snapshot)
        .await
        .unwrap();

    // 復元後はスナップショット時点の1件に戻る
    let after_restore = repo.get_active_tasks(&project_id).await.unwrap();
    assert_eq!(after_restore.len(), 1, "Should have 1 task after snapshot restore");
    assert_eq!(after_restore[0].id, task_id, "Original task should be preserved");
}

// ========== 一括論理削除メソッド（mark_all_*_deleted）==========

/// mark_all_tasks_deleted がすべてのタスクを論理削除することを確認
#[tokio::test]
async fn test_mark_all_tasks_deleted() {
    let (repo, _) = create_repo("test_mark_all_tasks_deleted").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    let task_list = make_test_task_list(&project_id, &user_id);
    repo.add_task_list(&project_id, &task_list).await.unwrap();

    // タスクを3件追加
    for _ in 0..3 {
        let task = make_test_task(&project_id, &task_list.id, &user_id);
        repo.add_task(&project_id, &task).await.unwrap();
    }

    // 全て active であることを確認
    let before = repo.get_active_tasks(&project_id).await.unwrap();
    assert_eq!(before.len(), 3);

    // 一括論理削除
    let delete_user = UserId::new();
    let timestamp = Utc::now();
    repo.mark_all_tasks_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();

    // 全て deleted になる
    let active_after = repo.get_active_tasks(&project_id).await.unwrap();
    assert_eq!(active_after.len(), 0, "No active tasks after mark_all_tasks_deleted");

    let deleted_after = repo.get_deleted_tasks(&project_id).await.unwrap();
    assert_eq!(deleted_after.len(), 3, "All 3 tasks should be deleted");

    // updated_by が設定されていること
    for task in &deleted_after {
        assert_eq!(task.updated_by, delete_user);
    }
}

/// mark_all_tags_deleted がすべてのタグを論理削除することを確認
#[tokio::test]
async fn test_mark_all_tags_deleted() {
    let (repo, _) = create_repo("test_mark_all_tags_deleted").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // タグを2件追加
    for _ in 0..2 {
        let tag = make_test_tag(&user_id);
        repo.add_tag(&project_id, &tag).await.unwrap();
    }

    // 一括論理削除
    let delete_user = UserId::new();
    let timestamp = Utc::now();
    repo.mark_all_tags_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();

    let active_after = repo.get_active_tags(&project_id).await.unwrap();
    assert_eq!(active_after.len(), 0, "No active tags after mark_all_tags_deleted");

    let deleted_after = repo.get_deleted_tags(&project_id).await.unwrap();
    assert_eq!(deleted_after.len(), 2, "All 2 tags should be deleted");
}

/// mark_all_task_lists_deleted がすべてのタスクリストを論理削除することを確認
#[tokio::test]
async fn test_mark_all_task_lists_deleted() {
    let (repo, _) = create_repo("test_mark_all_task_lists_deleted").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    // タスクリストを2件追加
    for _ in 0..2 {
        let tl = make_test_task_list(&project_id, &user_id);
        repo.add_task_list(&project_id, &tl).await.unwrap();
    }

    // 一括論理削除
    let delete_user = UserId::new();
    let timestamp = Utc::now();
    repo.mark_all_task_lists_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();

    let active_after = repo.get_active_task_lists(&project_id).await.unwrap();
    assert_eq!(active_after.len(), 0, "No active task lists after mark_all_task_lists_deleted");

    let deleted_after = repo.get_deleted_task_lists(&project_id).await.unwrap();
    assert_eq!(deleted_after.len(), 2, "All 2 task lists should be deleted");
}

/// delete_project 相当のフロー（子データ含む一括削除）を検証
#[tokio::test]
async fn test_cascade_logical_delete_flow() {
    let (repo, _) = create_repo("test_cascade_logical_delete_flow").await;
    let user_id = UserId::new();
    let project_id = ProjectId::new();
    let project = make_test_project(&project_id, &user_id);

    repo.create_empty_project_document(&project).await.unwrap();

    let task_list = make_test_task_list(&project_id, &user_id);
    repo.add_task_list(&project_id, &task_list).await.unwrap();

    let task = make_test_task(&project_id, &task_list.id, &user_id);
    repo.add_task(&project_id, &task).await.unwrap();

    let tag = make_test_tag(&user_id);
    repo.add_tag(&project_id, &tag).await.unwrap();

    // スナップショット作成
    let snapshot = repo.create_snapshot(&project_id).await.unwrap();

    // delete_project Facade と同等の Automerge 操作シーケンス
    let delete_user = UserId::new();
    let timestamp = Utc::now();

    repo.mark_all_tasks_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();
    repo.mark_all_tags_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();
    repo.mark_all_task_lists_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();
    repo.mark_project_deleted(&project_id, &delete_user, &timestamp)
        .await
        .unwrap();

    // すべて論理削除されたことを確認
    assert_eq!(repo.get_active_tasks(&project_id).await.unwrap().len(), 0);
    assert_eq!(repo.get_deleted_tasks(&project_id).await.unwrap().len(), 1);
    assert_eq!(repo.get_active_tags(&project_id).await.unwrap().len(), 0);
    assert_eq!(repo.get_deleted_tags(&project_id).await.unwrap().len(), 1);
    assert_eq!(repo.get_active_task_lists(&project_id).await.unwrap().len(), 0);
    assert_eq!(repo.get_deleted_task_lists(&project_id).await.unwrap().len(), 1);
    assert!(repo.get_deleted_project(&project_id).await.unwrap().is_some());

    // restore_project Facade と同等の Automerge 操作シーケンス
    let restore_user = UserId::new();
    let restore_time = Utc::now();

    repo.restore_project(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();
    repo.restore_all_task_lists(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();
    repo.restore_all_tags(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();
    repo.restore_all_tasks(&project_id, &restore_user, &restore_time)
        .await
        .unwrap();

    // 全て復元されたことを確認
    assert_eq!(repo.get_active_tasks(&project_id).await.unwrap().len(), 1);
    assert_eq!(repo.get_deleted_tasks(&project_id).await.unwrap().len(), 0);
    assert_eq!(repo.get_active_tags(&project_id).await.unwrap().len(), 1);
    assert_eq!(repo.get_deleted_tags(&project_id).await.unwrap().len(), 0);
    assert_eq!(repo.get_active_task_lists(&project_id).await.unwrap().len(), 1);
    assert_eq!(repo.get_deleted_task_lists(&project_id).await.unwrap().len(), 0);
    assert!(repo.get_deleted_project(&project_id).await.unwrap().is_none());

    // スナップショットはこのテストの参考情報として保持（直接利用しない）
    let _ = snapshot;
}
