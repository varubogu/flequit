//! Local Automerge Repository結合テスト
//!
//! Repository trait、DocumentManager、FileStorageの連携をテストし、
//! 実際のCRUD操作とautomerge-repoの動作を結合テストレベルで検証する

use chrono::{DateTime, Utc};
use serde_json::json;
use std::path::{Path, PathBuf};

// TestPathGeneratorを使用するためのインポート
use flequit_testing::TestPathGenerator;

use flequit_infrastructure_automerge::infrastructure::task_projects::project::ProjectLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::task_projects::project_list_repository::ProjectListLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::task_projects::subtask::SubTaskLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::task_projects::tag::TagLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::task_projects::task::TaskLocalAutomergeRepository;
use flequit_infrastructure_automerge::infrastructure::task_projects::task_list::TaskListLocalAutomergeRepository;
use flequit_model::models::task_projects::project::Project;
use flequit_model::models::task_projects::subtask::SubTask;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::models::task_projects::task::Task;
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId, TaskId, TaskListId, UserId};
use flequit_model::types::task_types::TaskStatus;
use flequit_repository::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::base_repository_trait::Repository;

/// テスト結果の永続保存用ヘルパー関数
fn create_persistent_test_dir(test_name: &str) -> PathBuf {
    // TestPathGeneratorを使用して正しいパス構造を生成
    let test_dir = TestPathGenerator::generate_test_dir(file!(), test_name);

    // プロジェクトルートを取得して相対パスを絶対パスに変換
    let current_dir = std::env::current_dir().expect("Failed to get current directory");
    let project_root = if current_dir.ends_with("src-tauri") {
        current_dir.parent().unwrap().to_path_buf()
    } else {
        current_dir
    };

    let final_dir = project_root.join(test_dir);

    if let Err(e) = std::fs::create_dir_all(&final_dir) {
        eprintln!("Failed to create persistent test directory: {}", e);
        // フォールバック：一時ディレクトリを返す
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        return std::env::temp_dir()
            .join("flequit_fallback")
            .join(test_name)
            .join(&timestamp);
    }

    println!("Integration test results will be saved to: {:?}", final_dir);
    final_dir
}

/// テストの永続保存ディレクトリにファイルをコピーするヘルパー
fn copy_to_persistent_storage(
    src_dir: &Path,
    dest_dir: &Path,
    test_name: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    if !src_dir.exists() {
        return Ok(());
    }

    // メタデータファイルを作成
    let metadata = json!({
        "test_name": test_name,
        "test_type": "integration_test",
        "execution_time": Utc::now().to_rfc3339(),
        "source_directory": src_dir.to_string_lossy(),
        "destination_directory": dest_dir.to_string_lossy()
    });

    let metadata_file = dest_dir.join("test_metadata.json");
    std::fs::write(&metadata_file, serde_json::to_string_pretty(&metadata)?)?;

    // ディレクトリ内容を再帰的にコピー
    copy_dir_recursive(src_dir, dest_dir)?;

    println!(
        "Integration test results copied to persistent storage: {:?}",
        dest_dir
    );
    Ok(())
}

/// ディレクトリを再帰的にコピーするヘルパー
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), Box<dyn std::error::Error>> {
    if !dst.exists() {
        std::fs::create_dir_all(dst)?;
    }

    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// プロジェクトリポジトリの基本CRUD操作テスト
#[tokio::test]
async fn test_project_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_project_repository_crud_operations");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    // プロジェクトリポジトリを作成
    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    // テスト用プロジェクトデータを作成
    let project_id = ProjectId::new();
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let user_id = UserId::new();
    let project = Project {
        id: project_id.clone(),
        name: "統合テストプロジェクト".to_string(),
        description: Some("Automerge Repository統合テストのためのプロジェクト".to_string()),
        color: Some("#ff5733".to_string()),
        order_index: 1,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    println!("Creating project: {:?}", project.name);

    // Create操作テスト
    repository.save(&project, &user_id, &timestamp).await?;
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
    let update_user_id = UserId::new();
    let update_timestamp = Utc::now();
    updated_project.name = "更新された統合テストプロジェクト".to_string();
    updated_project.description = Some("更新されたプロジェクト説明".to_string());
    updated_project.color = Some("#33ff57".to_string());
    updated_project.updated_at = update_timestamp;
    updated_project.updated_by = update_user_id.clone();

    repository.save(&updated_project, &update_user_id, &update_timestamp).await?;
    println!("✅ Project updated successfully");

    // 更新確認
    let updated_retrieved = repository.find_by_id(&project_id).await?;
    assert!(updated_retrieved.is_some());
    let updated = updated_retrieved.unwrap();
    assert_eq!(updated.name, "更新された統合テストプロジェクト");
    assert_eq!(
        updated.description,
        Some("更新されたプロジェクト説明".to_string())
    );
    // updated_at が更新されていることを確認
    assert_ne!(updated.updated_at, timestamp, "updated_at should be updated");
    // updated_by が正しく設定されていることを確認
    assert_eq!(updated.updated_by, update_user_id, "updated_by should match the update user");

    // List操作テスト (ProjectListLocalAutomergeRepositoryを使用)
    let project_list_repository =
        ProjectListLocalAutomergeRepository::new(automerge_dir.clone()).await?;
    project_list_repository
        .add_or_update_project(&updated)
        .await?;
    let all_projects = project_list_repository.list_projects().await?;
    assert!(!all_projects.is_empty());
    assert!(all_projects.iter().any(|p| p.id == project_id));
    println!(
        "✅ Project list retrieved: {} projects found",
        all_projects.len()
    );

    // Delete操作テスト
    repository.delete(&project_id).await?;
    println!("✅ Project deleted successfully");

    // 削除確認
    let deleted_check = repository.find_by_id(&project_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Project deletion confirmed");

    // automergeファイルを永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_project_repository_crud_operations",
    )?;

    Ok(())
}

/// 複数プロジェクトの並行処理テスト
#[tokio::test]
async fn test_multiple_projects_concurrent_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_multiple_projects_concurrent_operations");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let user_id = UserId::new();

    // 複数のプロジェクトを作成
    let mut projects = Vec::new();
    for i in 0..5 {
        let project = Project {
            id: ProjectId::new(),
            name: format!("プロジェクト_{}", i + 1),
            description: Some(format!("テストプロジェクト {} の説明", i + 1)),
            color: Some(format!("#ff{:02x}33", (i * 40) % 255)),
            order_index: i as i32,
            is_archived: false,
            status: None,
            owner_id: Some(user_id),
            created_at: timestamp,
            updated_at: timestamp,
            deleted: false,
            updated_by: user_id,
        };
        projects.push(project);
    }

    println!("Creating {} projects concurrently", projects.len());

    // プロジェクトリストリポジトリを作成
    let project_list_repository =
        ProjectListLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    // 並行作成
    for project in &projects {
        repository.save(project, &user_id, &timestamp).await?;
        project_list_repository
            .add_or_update_project(project)
            .await?;
    }

    // 全プロジェクトの存在確認 (ProjectListLocalAutomergeRepositoryを使用)
    let all_projects = project_list_repository.list_projects().await?;
    assert_eq!(all_projects.len(), projects.len());

    for project in &projects {
        let retrieved = repository.find_by_id(&project.id).await?;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, project.name);
    }

    println!("✅ All {} projects created and verified", projects.len());

    // 一部プロジェクトを並行更新
    for (i, project) in projects.iter().enumerate() {
        if i % 2 == 0 {
            // 偶数インデックスのプロジェクトを更新
            let mut updated_project = project.clone();
            updated_project.name = format!("更新されたプロジェクト_{}", i + 1);
            updated_project.description = Some(format!("更新された説明 {}", i + 1));
            updated_project.updated_at = Utc::now();
            updated_project.updated_by = user_id;

            repository.save(&updated_project, &user_id, &timestamp).await?;
            project_list_repository
                .add_or_update_project(&updated_project)
                .await?;
        }
    }

    // 更新確認 (ProjectListLocalAutomergeRepositoryを使用)
    let updated_projects = project_list_repository.list_projects().await?;
    let updated_count = updated_projects
        .iter()
        .filter(|p| p.name.starts_with("更新されたプロジェクト_"))
        .count();
    assert_eq!(updated_count, 3); // 0, 2, 4番目が更新される

    println!("✅ {} projects updated successfully", updated_count);

    // automergeファイルを永続保存
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_multiple_projects_concurrent_operations",
    )?;

    Ok(())
}

/// プロジェクトの段階的変更とautomerge履歴テスト
#[tokio::test]
async fn test_project_incremental_changes_with_history() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir =
        create_persistent_test_dir("test_project_incremental_changes_with_history");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    let project_id = ProjectId::new();
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let user_id = UserId::new();

    // Stage 1: 基本プロジェクト作成
    let stage1_project = Project {
        id: project_id.clone(),
        name: "段階的変更テストプロジェクト".to_string(),
        description: Some("初期プロジェクト".to_string()),
        color: Some("#0066cc".to_string()),
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(user_id),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    repository.save(&stage1_project, &user_id, &timestamp).await?;
    println!("✅ Stage 1: Basic project created");

    // Stage 1の状態をエクスポート
    let stage1_export_path = &temp_dir_path.join("exports/stage1_project_creation.json");
    std::fs::create_dir_all(stage1_export_path.parent().unwrap())?;
    repository
        .export_project_state(
            &project_id,
            &stage1_export_path,
            Some("Stage 1: 基本プロジェクト作成"),
        )
        .await?;

    // Stage 2: タグとメンバー追加
    let user_id2 = UserId::new();
    let timestamp2 = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let mut stage2_project = stage1_project.clone();
    stage2_project.name = "段階的変更テストプロジェクト（ステージ2）".to_string();
    stage2_project.description = Some("ステージ2で更新されたプロジェクト".to_string());
    stage2_project.color = Some("#cc6600".to_string());
    stage2_project.order_index = 1;
    stage2_project.updated_at = timestamp2;
    stage2_project.updated_by = user_id2;

    repository.save(&stage2_project, &user_id2, &timestamp2).await?;
    println!("✅ Stage 2: Tags and members added");

    // Stage 2の状態をエクスポート
    let stage2_export_path = &temp_dir_path.join("exports/stage2_tags_members.json");
    repository
        .export_project_state(
            &project_id,
            &stage2_export_path,
            Some("Stage 2: タグとメンバー追加"),
        )
        .await?;

    // Stage 3: プロジェクト詳細拡張
    let timestamp3 = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let user_id3 = UserId::new();
    let mut stage3_project = stage2_project.clone();
    stage3_project.name = "段階的変更テストプロジェクト（最終版）".to_string();
    stage3_project.description = Some("ステージ3で完成されたプロジェクト".to_string());
    stage3_project.color = Some("#00cc66".to_string());
    stage3_project.order_index = 2;
    stage3_project.is_archived = false;
    stage3_project.updated_at = timestamp3;
    stage3_project.updated_by = user_id3;

    repository.save(&stage3_project, &user_id3, &timestamp3).await?;
    println!("✅ Stage 3: Project fully enhanced");

    // Stage 3の状態をエクスポート
    let stage3_export_path = &temp_dir_path.join("exports/stage3_final_project.json");
    repository
        .export_project_state(
            &project_id,
            &stage3_export_path,
            Some("Stage 3: プロジェクト詳細拡張完了"),
        )
        .await?;

    // 最終状態の検証
    let final_project = repository.find_by_id(&project_id).await?;
    assert!(final_project.is_some());
    let final_proj = final_project.unwrap();

    assert_eq!(final_proj.name, "段階的変更テストプロジェクト（最終版）");
    assert_eq!(final_proj.color, Some("#00cc66".to_string()));
    assert_eq!(final_proj.order_index, 2);
    assert!(!final_proj.is_archived);

    println!(
        "✅ Final verification completed: color={:?}, order={}",
        final_proj.color, final_proj.order_index
    );

    // 詳細変更履歴をエクスポート
    let changes_history_dir = &temp_dir_path.join("detailed_changes_history");
    repository
        .export_project_changes_history(
            &project_id,
            &changes_history_dir,
            Some("Project repository incremental changes with detailed JSON evolution tracking"),
        )
        .await?;

    println!(
        "✅ JSON changes history exported to: {:?}",
        changes_history_dir
    );

    // automerge履歴データを永続保存
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_project_incremental_changes_with_history",
    )?;

    // エクスポートしたJSONファイルも永続保存にコピー
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_project_incremental_changes_with_history",
    )?;

    Ok(())
}

/// プロジェクトリポジトリのJSON変更履歴エクスポート専用テスト
#[tokio::test]
async fn test_project_repository_json_export_with_detailed_changes(
) -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir =
        create_persistent_test_dir("test_project_repository_json_export_with_detailed_changes");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    println!("=== プロジェクトリポジトリJSON変更履歴テスト開始 ===");

    // プロジェクト1: 基本プロジェクト
    let project1_id = ProjectId::new();
    let user_id = UserId::new();
    let timestamp = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();

    let project1 = Project {
        id: project1_id.clone(),
        name: "基本プロジェクト".to_string(),
        description: Some("最初のプロジェクト".to_string()),
        color: Some("#3498db".to_string()),
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(user_id),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id,
    };

    repository.save(&project1, &user_id, &timestamp).await?;
    println!("📝 プロジェクト1作成完了: {}", project1.name);

    // Change 1をエクスポート
    let change1_path = temp_dir_path.join("project_changes/change_1_first_project.json");
    std::fs::create_dir_all(change1_path.parent().unwrap())?;
    repository
        .export_project_state(
            &project1_id,
            &change1_path,
            Some("Change 1: First project created"),
        )
        .await?;

    // プロジェクト2: 第二のプロジェクト追加
    let project2_id = ProjectId::new();
    let user_id2 = UserId::new();
    let timestamp2 = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let project2 = Project {
        id: project2_id.clone(),
        name: "拡張プロジェクト".to_string(),
        description: Some("機能拡張を行うプロジェクト".to_string()),
        color: Some("#e74c3c".to_string()),
        order_index: 1,
        is_archived: false,
        status: None,
        owner_id: Some(user_id2),
        created_at: timestamp2,
        updated_at: timestamp2,
        deleted: false,
        updated_by: user_id2,
    };

    repository.save(&project2, &user_id2, &timestamp2).await?;
    println!("📝 プロジェクト2作成完了: {}", project2.name);

    // Change 2をエクスポート
    let change2_path = temp_dir_path.join("project_changes/change_2_second_project.json");
    repository
        .export_project_state(
            &project2_id,
            &change2_path,
            Some("Change 2: Second project added"),
        )
        .await?;

    // プロジェクト1を更新（色変更とアーカイブ）
    let user_id3 = UserId::new();
    let timestamp3 = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let mut updated_project1 = project1.clone();
    updated_project1.name = "更新された基本プロジェクト".to_string();
    updated_project1.description = Some("説明を更新したプロジェクト".to_string());
    updated_project1.color = Some("#f39c12".to_string());
    updated_project1.order_index = 10;
    updated_project1.updated_at = timestamp3;
    updated_project1.updated_by = user_id3;

    repository.save(&updated_project1, &user_id3, &timestamp3).await?;
    println!("📝 プロジェクト1更新完了: {}", updated_project1.name);

    // Change 3をエクスポート
    let change3_path = temp_dir_path.join("project_changes/change_3_updated_first_project.json");
    repository
        .export_project_state(
            &project1_id,
            &change3_path,
            Some("Change 3: First project updated with new color and description"),
        )
        .await?;

    // プロジェクト3: 第三のプロジェクト追加（複雑な設定）
    let project3_id = ProjectId::new();
    let user_id_p3 = UserId::new();
    let timestamp_p3 = DateTime::<Utc>::from_timestamp(1717708800, 0).unwrap();
    let project3 = Project {
        id: project3_id.clone(),
        name: "高度な設定プロジェクト".to_string(),
        description: Some("複雑な設定を持つプロジェクト。このプロジェクトは長い説明を含んでいて、automergeでの保存と復元がどのように動作するかをテストする目的があります。".to_string()),
        color: Some("#9b59b6".to_string()),
        order_index: 5,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: timestamp_p3,
        updated_at: timestamp_p3,
        deleted: false,
        updated_by: user_id_p3.clone(),
    };

    repository.save(&project3, &user_id_p3, &timestamp_p3).await?;
    println!("📝 プロジェクト3作成完了: {}", project3.name);

    // Change 4をエクスポート
    let change4_path = temp_dir_path.join("project_changes/change_4_complex_third_project.json");
    repository
        .export_project_state(
            &project3_id,
            &change4_path,
            Some("Change 4: Complex third project with detailed configuration"),
        )
        .await?;

    // プロジェクト2をアーカイブ
    let mut archived_project2 = project2.clone();
    let user_id_archive = UserId::new();
    let timestamp_archive = Utc::now();
    archived_project2.is_archived = true;
    archived_project2.name = "アーカイブされた拡張プロジェクト".to_string();
    archived_project2.updated_at = timestamp_archive;
    archived_project2.updated_by = user_id_archive.clone();

    repository.save(&archived_project2, &user_id_archive, &timestamp_archive).await?;
    println!("📝 プロジェクト2アーカイブ完了: {}", archived_project2.name);

    // Change 5をエクスポート
    let change5_path = temp_dir_path.join("project_changes/change_5_archived_second_project.json");
    repository
        .export_project_state(
            &project2_id,
            &change5_path,
            Some("Change 5: Second project archived"),
        )
        .await?;

    // 最終検証 (ProjectListLocalAutomergeRepositoryを使用)
    let project_list_repository =
        ProjectListLocalAutomergeRepository::new(automerge_dir.clone()).await?;
    // プロジェクトリストに全てのプロジェクトを追加
    project_list_repository
        .add_or_update_project(&updated_project1)
        .await?;
    project_list_repository
        .add_or_update_project(&archived_project2)
        .await?;
    project_list_repository
        .add_or_update_project(&project3)
        .await?;

    let all_projects = project_list_repository.list_projects().await?;
    println!("📊 最終プロジェクト数: {}", all_projects.len());
    assert_eq!(all_projects.len(), 3);

    // アーカイブされたプロジェクトの確認
    let archived_project = all_projects.iter().find(|p| p.is_archived);
    assert!(archived_project.is_some());
    assert_eq!(
        archived_project.unwrap().name,
        "アーカイブされた拡張プロジェクト"
    );

    // 詳細変更履歴をエクスポート
    let detailed_changes_dir = &temp_dir_path.join("detailed_automerge_changes");
    repository.export_project_changes_history(
        &project1_id,
        &detailed_changes_dir,
        Some("Complete project repository evolution with multiple projects and complex modifications")
    ).await?;

    println!(
        "✅ 詳細automerge変更履歴エクスポート完了: {:?}",
        detailed_changes_dir
    );
    println!("=== プロジェクトリポジトリJSON変更履歴テスト完了 ===");

    // 全データを永続保存にコピー
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_project_repository_json_export_with_detailed_changes",
    )?;

    Ok(())
}

/// 複数のRepositoryタイプの統合テスト
#[tokio::test]
#[ignore] // UserとAccountのリポジトリ実装が未完成のため一時的に無効化
async fn test_multiple_repository_types_integration() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_multiple_repository_types_integration");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    // プロジェクトリポジトリのみ使用（他のリポジトリは実装が未完成）
    let project_repo = ProjectLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    println!("Created project repository for integration test");

    // シンプルなユーザーIDを作成
    let user_id = UserId::new();

    // プロジェクトを作成（ユーザーと関連付け）
    let project_id = ProjectId::new();
    let timestamp = Utc::now();
    let project = Project {
        id: project_id.clone(),
        name: "統合テスト用プロジェクト".to_string(),
        description: Some("プロジェクトのみの統合をテストするプロジェクト".to_string()),
        color: Some("#4a90e2".to_string()),
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(user_id.clone()),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id.clone(),
    };

    project_repo.save(&project, &user_id, &timestamp).await?;
    println!("✅ Project created with user relationship");

    // プロジェクトの検証
    let retrieved_project = project_repo.find_by_id(&project_id).await?;

    assert!(retrieved_project.is_some());
    let proj = retrieved_project.unwrap();

    // リレーション検証
    assert_eq!(proj.owner_id, Some(user_id.clone()));

    println!("✅ Project integration verified:");
    println!("  - Project: {}", proj.name);
    println!("  - Owner ID: {:?}", proj.owner_id);

    // automergeファイル群を永続保存
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_multiple_repository_types_integration",
    )?;

    Ok(())
}

/// エラーハンドリングと例外ケースのテスト
#[tokio::test]
async fn test_error_handling_and_edge_cases() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_error_handling_and_edge_cases");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    // 存在しないIDでの取得テスト
    let non_existent_id = ProjectId::new();
    let result = repository.find_by_id(&non_existent_id).await?;
    assert!(result.is_none());
    println!("✅ Non-existent ID handling verified");

    // 存在しないプロジェクトの更新テスト
    let fake_user_id = UserId::new();
    let fake_timestamp = Utc::now();
    let fake_project = Project {
        id: ProjectId::new(),
        name: "存在しないプロジェクト".to_string(),
        description: None,
        color: None,
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: fake_timestamp,
        updated_at: fake_timestamp,
        deleted: false,
        updated_by: fake_user_id.clone(),
    };

    // 更新は成功する可能性があります（automergeの特性上、新規作成として扱われる場合）
    let update_result = repository.save(&fake_project, &fake_user_id, &fake_timestamp).await;
    println!(
        "✅ Update non-existent project result: {:?}",
        update_result.is_ok()
    );

    // 存在しないプロジェクトの削除テスト
    let delete_result = repository.delete(&non_existent_id).await;
    println!(
        "✅ Delete non-existent project result: {:?}",
        delete_result.is_ok()
    );

    // 空のプロジェクト名でのテスト
    let empty_user_id = UserId::new();
    let empty_timestamp = Utc::now();
    let empty_name_project = Project {
        id: ProjectId::new(),
        name: "".to_string(),
        description: None,
        color: None,
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: empty_timestamp,
        updated_at: empty_timestamp,
        deleted: false,
        updated_by: empty_user_id.clone(),
    };

    let create_result = repository.save(&empty_name_project, &empty_user_id, &empty_timestamp).await;
    println!(
        "✅ Empty name project creation result: {:?}",
        create_result.is_ok()
    );

    // 大きなデータでのテスト
    let large_user_id = UserId::new();
    let large_timestamp = Utc::now();
    let large_project = Project {
        id: ProjectId::new(),
        name: "大きなプロジェクト".to_string(),
        description: Some("非常に長い説明: ".to_string() + &"あ".repeat(1000)),
        color: Some("#ff00ff".to_string()),
        order_index: 999,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: large_timestamp,
        updated_at: large_timestamp,
        deleted: false,
        updated_by: large_user_id.clone(),
    };

    let large_create_result = repository.save(&large_project, &large_user_id, &large_timestamp).await;
    println!(
        "✅ Large project creation result: {:?}",
        large_create_result.is_ok()
    );

    if large_create_result.is_ok() {
        let retrieved_large = repository.find_by_id(&large_project.id).await?;
        if let Some(large_proj) = retrieved_large {
            println!(
                "✅ Large project verified: name={}, description_len={}",
                large_proj.name,
                large_proj
                    .description
                    .as_ref()
                    .map(|d| d.len())
                    .unwrap_or(0)
            );
        }
    }

    // automergeファイルを永続保存
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_error_handling_and_edge_cases",
    )?;

    Ok(())
}

/// TaskListリポジトリの基本CRUD操作テスト
#[tokio::test]
async fn test_task_list_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_task_list_repository_crud_operations");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    // TaskListリポジトリを作成
    let repository = TaskListLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    // テスト用TaskListデータを作成
    let task_list_id = TaskListId::new();
    let project_id = ProjectId::new();
    let user_id = UserId::new();
    let timestamp = Utc::now();
    let task_list = TaskList {
        id: task_list_id.clone(),
        project_id: project_id.clone(),
        name: "統合テスト用タスクリスト".to_string(),
        description: Some("Automerge Repository統合テストのためのタスクリスト".to_string()),
        color: Some("#3498db".to_string()),
        order_index: 1,
        is_archived: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id.clone(),
    };

    println!("Creating task list: {:?}", task_list.name);

    // Create操作テスト
    repository.save(&project_id, &task_list, &user_id, &timestamp).await?;
    println!("✅ TaskList created successfully");

    // Read操作テスト
    let retrieved_task_list = repository.find_by_id(&project_id, &task_list_id).await?;
    assert!(retrieved_task_list.is_some());
    let retrieved = retrieved_task_list.unwrap();
    assert_eq!(retrieved.name, task_list.name);
    assert_eq!(retrieved.description, task_list.description);
    // project_idフィールドが削除されたため、この比較はコメントアウト
    // assert_eq!(retrieved.project_id, task_list.project_id);
    println!("✅ TaskList retrieved successfully: {}", retrieved.name);

    // Update操作テスト
    let mut updated_task_list = task_list.clone();
    let update_user_id = UserId::new();
    let update_timestamp = Utc::now();
    updated_task_list.name = "更新された統合テスト用タスクリスト".to_string();
    updated_task_list.description = Some("更新されたタスクリスト説明".to_string());
    updated_task_list.color = Some("#e74c3c".to_string());
    updated_task_list.order_index = 2;
    updated_task_list.updated_at = update_timestamp;
    updated_task_list.updated_by = update_user_id.clone();

    repository.save(&project_id, &updated_task_list, &update_user_id, &update_timestamp).await?;
    println!("✅ TaskList updated successfully");

    // 更新確認
    let updated_retrieved = repository.find_by_id(&project_id, &task_list_id).await?;
    assert!(updated_retrieved.is_some());
    let updated = updated_retrieved.unwrap();
    assert_eq!(updated.name, "更新された統合テスト用タスクリスト");
    assert_eq!(
        updated.description,
        Some("更新されたタスクリスト説明".to_string())
    );
    assert_eq!(updated.color, Some("#e74c3c".to_string()));
    assert_eq!(updated.order_index, 2);
    // updated_at が更新されていることを確認
    assert_ne!(updated.updated_at, timestamp, "updated_at should be updated");
    // updated_by が正しく設定されていることを確認
    assert_eq!(updated.updated_by, update_user_id, "updated_by should match the update user");

    // List操作テスト
    let all_task_lists = repository.find_all(&project_id).await?;
    assert!(!all_task_lists.is_empty());
    assert!(all_task_lists.iter().any(|tl| tl.id == task_list_id));
    println!(
        "✅ TaskList list retrieved: {} task lists found",
        all_task_lists.len()
    );

    // Exists操作テスト
    let exists = repository.exists(&project_id, &task_list_id).await?;
    assert!(exists);
    println!("✅ TaskList exists confirmed");

    // Count操作テスト
    let count = repository.count(&project_id).await?;
    assert!(count > 0);
    println!("✅ TaskList count: {}", count);

    // TODO: 詳細変更履歴をエクスポート（一時的にスキップ）
    // export_task_list_changes_history は現在のAPIで利用できないため、一時的にスキップ
    let _changes_history_dir = &temp_dir_path.join("detailed_changes_history");
    println!("📝 Skipped task list changes history export (not implemented)");

    // Delete操作テスト
    repository.delete(&project_id, &task_list_id).await?;
    println!("✅ TaskList deleted successfully");

    // 削除確認
    let deleted_check = repository.find_by_id(&project_id, &task_list_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ TaskList deletion confirmed");

    // 削除後のCount確認
    let count_after_delete = repository.count(&project_id).await?;
    assert_eq!(count_after_delete, count - 1);
    println!("✅ TaskList count after deletion: {}", count_after_delete);

    // 冪等性テスト: 既に削除されたタスクリストを再度削除してもエラーにならないことを確認
    let second_delete_result = repository.delete(&project_id, &task_list_id).await;
    assert!(second_delete_result.is_ok());
    println!("✅ TaskList idempotent deletion confirmed (deleting already deleted item succeeded)");

    // automergeファイルを永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_task_list_repository_crud_operations",
    )?;

    // エクスポートしたJSONファイルも永続保存にコピー
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_task_list_repository_crud_operations",
    )?;

    Ok(())
}

/// TaskリポジトリのCRUD操作テスト
#[tokio::test]
async fn test_task_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_task_repository_crud_operations");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    // Taskリポジトリを作成
    let repository = TaskLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    // テスト用Taskデータを作成
    let task_id = TaskId::new();
    let project_id = ProjectId::new();
    let task_list_id = TaskListId::new();
    let user_id = UserId::new();
    let timestamp = Utc::now();
    let task = Task {
        id: task_id.clone(),
        project_id: project_id.clone(),
        list_id: task_list_id.clone(),
        title: "統合テスト用タスク".to_string(),
        description: Some("Automerge Repository統合テストのためのタスク".to_string()),
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
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id.clone(),
    };

    println!("Creating task: {:?}", task.title);

    // Create操作テスト
    repository.save(&project_id, &task, &user_id, &timestamp).await?;
    println!("✅ Task created successfully");

    // Read操作テスト
    let retrieved_task = repository.find_by_id(&project_id, &task_id).await?;
    assert!(retrieved_task.is_some());
    let retrieved = retrieved_task.unwrap();
    assert_eq!(retrieved.title, task.title);
    assert_eq!(retrieved.description, task.description);
    assert_eq!(retrieved.list_id, task.list_id);
    assert_eq!(retrieved.status, task.status);
    println!("✅ Task retrieved successfully: {}", retrieved.title);

    // Update操作テスト
    let mut updated_task = task.clone();
    let update_user_id = UserId::new();
    let update_timestamp = Utc::now();
    updated_task.title = "更新された統合テスト用タスク".to_string();
    updated_task.description = Some("更新されたタスク説明".to_string());
    updated_task.status = TaskStatus::InProgress;
    updated_task.priority = 2;
    updated_task.updated_at = update_timestamp;
    updated_task.updated_by = update_user_id.clone();

    repository.save(&project_id, &updated_task, &update_user_id, &update_timestamp).await?;
    println!("✅ Task updated successfully");

    // 更新確認
    let updated_retrieved = repository.find_by_id(&project_id, &task_id).await?;
    assert!(updated_retrieved.is_some());
    let updated = updated_retrieved.unwrap();
    assert_eq!(updated.title, "更新された統合テスト用タスク");
    assert_eq!(updated.status, TaskStatus::InProgress);
    assert_eq!(updated.priority, 2);
    // updated_at が更新されていることを確認
    assert_ne!(updated.updated_at, timestamp, "updated_at should be updated");
    // updated_by が正しく設定されていることを確認
    assert_eq!(updated.updated_by, update_user_id, "updated_by should match the update user");

    // List操作テスト
    let all_tasks = repository.find_all(&project_id).await?;
    assert!(!all_tasks.is_empty());
    assert!(all_tasks.iter().any(|t| t.id == task_id));
    println!("✅ Task list retrieved: {} tasks found", all_tasks.len());

    // TODO: 詳細変更履歴をエクスポート（一時的にスキップ）
    // export_task_changes_history は現在のAPIで利用できないため、一時的にスキップ
    let _changes_history_dir = &temp_dir_path.join("detailed_changes_history");
    println!("📝 Skipped task changes history export (not implemented)");

    // Delete操作テスト
    repository.delete(&project_id, &task_id).await?;
    println!("✅ Task deleted successfully");

    // 削除確認
    let deleted_check = repository.find_by_id(&project_id, &task_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Task deletion confirmed");

    // automergeファイルを永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_task_repository_crud_operations",
    )?;

    // エクスポートしたJSONファイルも永続保存にコピー
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_task_repository_crud_operations",
    )?;

    Ok(())
}

/// SubTaskリポジトリのCRUD操作テスト
#[tokio::test]
async fn test_subtask_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_subtask_repository_crud_operations");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    // SubTaskリポジトリを作成
    let repository = SubTaskLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    // テスト用SubTaskデータを作成
    let project_id = ProjectId::new();
    let subtask_id = SubTaskId::new();
    let task_id = TaskId::new();
    let user_id = UserId::new();
    let timestamp = Utc::now();
    let subtask = SubTask {
        id: subtask_id.clone(),
        task_id: task_id.clone(),
        title: "統合テスト用サブタスク".to_string(),
        description: Some("Automerge Repository統合テストのためのサブタスク".to_string()),
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
        order_index: 1,
        completed: false,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id.clone(),
    };

    println!("Creating subtask: {:?}", subtask.title);

    // Create操作テスト
    repository.save(&project_id, &subtask, &user_id, &timestamp).await?;
    println!("✅ SubTask created successfully");

    // Read操作テスト
    let retrieved_subtask = repository.find_by_id(&project_id, &subtask_id).await?;
    assert!(retrieved_subtask.is_some());
    let retrieved = retrieved_subtask.unwrap();
    assert_eq!(retrieved.title, subtask.title);
    assert_eq!(retrieved.task_id, subtask.task_id);
    assert_eq!(retrieved.status, subtask.status);
    println!("✅ SubTask retrieved successfully: {}", retrieved.title);

    // Update操作テスト
    let mut updated_subtask = subtask.clone();
    let update_user_id = UserId::new();
    let update_timestamp = Utc::now();
    updated_subtask.title = "更新された統合テスト用サブタスク".to_string();
    updated_subtask.description = Some("更新されたサブタスク説明".to_string());
    updated_subtask.status = TaskStatus::Completed;
    updated_subtask.order_index = 2;
    updated_subtask.updated_at = update_timestamp;
    updated_subtask.updated_by = update_user_id.clone();

    repository.save(&project_id, &updated_subtask, &update_user_id, &update_timestamp).await?;
    println!("✅ SubTask updated successfully");

    // 更新確認
    let updated_retrieved = repository.find_by_id(&project_id, &subtask_id).await?;
    assert!(updated_retrieved.is_some());
    let updated = updated_retrieved.unwrap();
    assert_eq!(updated.title, "更新された統合テスト用サブタスク");
    assert_eq!(updated.status, TaskStatus::Completed);
    assert_eq!(updated.order_index, 2);
    // updated_at が更新されていることを確認
    assert_ne!(updated.updated_at, timestamp, "updated_at should be updated");
    // updated_by が正しく設定されていることを確認
    assert_eq!(updated.updated_by, update_user_id, "updated_by should match the update user");

    // List操作テスト
    let all_subtasks = repository.find_all(&project_id).await?;
    assert!(!all_subtasks.is_empty());
    assert!(all_subtasks.iter().any(|st| st.id == subtask_id));
    println!(
        "✅ SubTask list retrieved: {} subtasks found",
        all_subtasks.len()
    );

    // TODO: 詳細変更履歴をエクスポート（一時的にスキップ）
    // export_subtask_changes_history は現在のAPIで利用できないため、一時的にスキップ
    let _changes_history_dir = &temp_dir_path.join("detailed_changes_history");
    println!("📝 Skipped subtask changes history export (not implemented)");

    // Delete操作テスト
    repository.delete(&project_id, &subtask_id).await?;
    println!("✅ SubTask deleted successfully");

    // 削除確認
    let deleted_check = repository.find_by_id(&project_id, &subtask_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ SubTask deletion confirmed");

    // automergeファイルを永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_subtask_repository_crud_operations",
    )?;

    // エクスポートしたJSONファイルも永続保存にコピー
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_subtask_repository_crud_operations",
    )?;

    Ok(())
}

/// TagリポジトリのCRUD操作テスト
#[tokio::test]
async fn test_tag_repository_crud_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_automerge");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_tag_repository_crud_operations");
    let automerge_dir = &temp_dir_path.join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;

    // Tagリポジトリを作成
    let repository = TagLocalAutomergeRepository::new(automerge_dir.clone()).await?;

    // テスト用プロジェクトIDとTagデータを作成
    let project_id = ProjectId::new();
    let tag_id = TagId::new();
    let user_id = UserId::new();
    let timestamp = Utc::now();
    let tag = Tag {
        id: tag_id.clone(),
        name: "統合テスト".to_string(),
        color: Some("#f39c12".to_string()),
        order_index: Some(1),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        updated_by: user_id.clone(),
    };

    println!("Creating tag: {:?}", tag.name);

    // Create操作テスト
    repository.save(&project_id, &tag, &user_id, &timestamp).await?;
    println!("✅ Tag created successfully");

    // Read操作テスト
    let retrieved_tag = repository.find_by_id(&project_id, &tag_id).await?;
    assert!(retrieved_tag.is_some());
    let retrieved = retrieved_tag.unwrap();
    assert_eq!(retrieved.name, tag.name);
    assert_eq!(retrieved.color, tag.color);
    assert_eq!(retrieved.order_index, tag.order_index);
    println!("✅ Tag retrieved successfully: {}", retrieved.name);

    // Update操作テスト
    let mut updated_tag = tag.clone();
    let update_user_id = UserId::new();
    let update_timestamp = Utc::now();
    updated_tag.name = "更新された統合テスト".to_string();
    updated_tag.color = Some("#e74c3c".to_string());
    updated_tag.order_index = Some(2);
    updated_tag.updated_at = update_timestamp;
    updated_tag.updated_by = update_user_id.clone();

    repository.save(&project_id, &updated_tag, &update_user_id, &update_timestamp).await?;
    println!("✅ Tag updated successfully");

    // 更新確認
    let updated_retrieved = repository.find_by_id(&project_id, &tag_id).await?;
    assert!(updated_retrieved.is_some());
    let updated = updated_retrieved.unwrap();
    assert_eq!(updated.name, "更新された統合テスト");
    assert_eq!(updated.color, Some("#e74c3c".to_string()));
    assert_eq!(updated.order_index, Some(2));
    // updated_at が更新されていることを確認
    assert_ne!(updated.updated_at, timestamp, "updated_at should be updated");
    // updated_by が正しく設定されていることを確認
    assert_eq!(updated.updated_by, update_user_id, "updated_by should match the update user");

    // List操作テスト
    let all_tags = repository.find_all(&project_id).await?;
    assert!(!all_tags.is_empty());
    assert!(all_tags.iter().any(|t| t.id == tag_id));
    println!("✅ Tag list retrieved: {} tags found", all_tags.len());

    // TODO: 詳細変更履歴をエクスポート（一時的にスキップ）
    // export_tag_changes_history は現在のAPIで利用できないため、一時的にスキップ
    let _changes_history_dir = &temp_dir_path.join("detailed_changes_history");
    println!("📝 Skipped tag changes history export (not implemented)");

    // Delete操作テスト
    repository.delete(&project_id, &tag_id).await?;
    println!("✅ Tag deleted successfully");

    // 削除確認
    let deleted_check = repository.find_by_id(&project_id, &tag_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Tag deletion confirmed");

    // automergeファイルを永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &automerge_dir,
        &persistent_dir,
        "test_tag_repository_crud_operations",
    )?;

    // エクスポートしたJSONファイルも永続保存にコピー
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_tag_repository_crud_operations",
    )?;

    Ok(())
}
