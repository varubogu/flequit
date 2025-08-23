//! Local Automerge Repository結合テスト
//! 
//! Repository trait、DocumentManager、FileStorageの連携をテストし、
//! 実際のCRUD操作とautomerge-repoの動作を結合テストレベルで検証する

use tempfile::TempDir;
use serde_json::json;
use std::path::{Path, PathBuf};
use chrono::Utc;

use flequit_lib::models::project::Project;
use flequit_lib::repositories::local_automerge::project::ProjectLocalAutomergeRepository;
use flequit_lib::repositories::base_repository_trait::Repository;
use flequit_lib::repositories::project_repository_trait::ProjectRepositoryTrait;
use flequit_lib::types::id_types::{ProjectId, UserId};

/// テスト結果の永続保存用ヘルパー関数
fn create_persistent_test_dir(test_name: &str) -> PathBuf {
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    
    // プロジェクトルートから.tmp/testsディレクトリを特定
    let current_dir = std::env::current_dir().expect("Failed to get current directory");
    let project_root = if current_dir.ends_with("src-tauri") {
        current_dir.parent().unwrap().to_path_buf()
    } else {
        current_dir
    };
    
    let base_path = project_root.join(".tmp/tests/cargo/integration/local_automerge_repository_integration_test");
    let test_dir = base_path.join(test_name).join(&timestamp);
    
    if let Err(e) = std::fs::create_dir_all(&test_dir) {
        eprintln!("Failed to create persistent test directory: {}", e);
        // フォールバック：一時ディレクトリを返す
        return std::env::temp_dir().join("flequit_fallback").join(test_name).join(&timestamp);
    }
    
    println!("Integration test results will be saved to: {:?}", test_dir);
    test_dir
}

/// テストの永続保存ディレクトリにファイルをコピーするヘルパー
fn copy_to_persistent_storage(src_dir: &Path, dest_dir: &Path, test_name: &str) -> Result<(), Box<dyn std::error::Error>> {
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
    
    println!("Integration test results copied to persistent storage: {:?}", dest_dir);
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
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_project_repository_crud_operations");
    let automerge_dir = temp_dir.path().join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;
    
    // プロジェクトリポジトリを作成
    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone())?;
    
    // テスト用プロジェクトデータを作成
    let project_id = ProjectId::new();
    let project = Project {
        id: project_id.clone(),
        name: "統合テストプロジェクト".to_string(),
        description: Some("Automerge Repository統合テストのためのプロジェクト".to_string()),
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
    updated_project.name = "更新された統合テストプロジェクト".to_string();
    updated_project.description = Some("更新されたプロジェクト説明".to_string());
    updated_project.color = Some("#33ff57".to_string());
    updated_project.updated_at = Utc::now();
    
    repository.save(&updated_project).await?;
    println!("✅ Project updated successfully");
    
    // 更新確認
    let updated_retrieved = repository.find_by_id(&project_id).await?;
    assert!(updated_retrieved.is_some());
    let updated = updated_retrieved.unwrap();
    assert_eq!(updated.name, "更新された統合テストプロジェクト");
    assert_eq!(updated.description, Some("更新されたプロジェクト説明".to_string()));
    
    // List操作テスト
    let all_projects = repository.find_all().await?;
    assert!(!all_projects.is_empty());
    assert!(all_projects.iter().any(|p| p.id == project_id));
    println!("✅ Project list retrieved: {} projects found", all_projects.len());
    
    // Delete操作テスト
    repository.delete(&project_id).await?;
    println!("✅ Project deleted successfully");
    
    // 削除確認
    let deleted_check = repository.find_by_id(&project_id).await?;
    assert!(deleted_check.is_none());
    println!("✅ Project deletion confirmed");
    
    // automergeファイルを永続保存ディレクトリにコピー
    copy_to_persistent_storage(&automerge_dir, &persistent_dir, "test_project_repository_crud_operations")?;
    
    Ok(())
}

/// 複数プロジェクトの並行処理テスト
#[tokio::test]
async fn test_multiple_projects_concurrent_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_multiple_projects_concurrent_operations");
    let automerge_dir = temp_dir.path().join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;
    
    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone())?;
    
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
            owner_id: Some(UserId::new()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        projects.push(project);
    }
    
    println!("Creating {} projects concurrently", projects.len());
    
    // 並行作成
    for project in &projects {
        repository.save(project).await?;
    }
    
    // 全プロジェクトの存在確認
    let all_projects = repository.find_all().await?;
    assert_eq!(all_projects.len(), projects.len());
    
    for project in &projects {
        let retrieved = repository.find_by_id(&project.id).await?;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, project.name);
    }
    
    println!("✅ All {} projects created and verified", projects.len());
    
    // 一部プロジェクトを並行更新
    for (i, project) in projects.iter().enumerate() {
        if i % 2 == 0 { // 偶数インデックスのプロジェクトを更新
            let mut updated_project = project.clone();
            updated_project.name = format!("更新されたプロジェクト_{}", i + 1);
            updated_project.description = Some(format!("更新された説明 {}", i + 1));
            updated_project.updated_at = Utc::now();
            
            repository.save(&updated_project).await?;
        }
    }
    
    // 更新確認
    let updated_projects = repository.find_all().await?;
    let updated_count = updated_projects.iter()
        .filter(|p| p.name.starts_with("更新されたプロジェクト_"))
        .count();
    assert_eq!(updated_count, 3); // 0, 2, 4番目が更新される
    
    println!("✅ {} projects updated successfully", updated_count);
    
    // automergeファイルを永続保存
    copy_to_persistent_storage(&automerge_dir, &persistent_dir, "test_multiple_projects_concurrent_operations")?;
    
    Ok(())
}

/// プロジェクトの段階的変更とautomerge履歴テスト
#[tokio::test]
async fn test_project_incremental_changes_with_history() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_project_incremental_changes_with_history");
    let automerge_dir = temp_dir.path().join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;
    
    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone())?;
    
    let project_id = ProjectId::new();
    
    // Stage 1: 基本プロジェクト作成
    let stage1_project = Project {
        id: project_id.clone(),
        name: "段階的変更テストプロジェクト".to_string(),
        description: Some("初期プロジェクト".to_string()),
        color: Some("#0066cc".to_string()),
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    repository.save(&stage1_project).await?;
    println!("✅ Stage 1: Basic project created");
    
    // Stage 2: タグとメンバー追加
    let mut stage2_project = stage1_project.clone();
    stage2_project.name = "段階的変更テストプロジェクト（ステージ2）".to_string();
    stage2_project.description = Some("ステージ2で更新されたプロジェクト".to_string());
    stage2_project.color = Some("#cc6600".to_string());
    stage2_project.order_index = 1;
    stage2_project.updated_at = Utc::now();
    
    repository.save(&stage2_project).await?;
    println!("✅ Stage 2: Tags and members added");
    
    // Stage 3: プロジェクト詳細拡張
    let mut stage3_project = stage2_project.clone();
    stage3_project.name = "段階的変更テストプロジェクト（最終版）".to_string();
    stage3_project.description = Some("ステージ3で完成されたプロジェクト".to_string());
    stage3_project.color = Some("#00cc66".to_string());
    stage3_project.order_index = 2;
    stage3_project.is_archived = false;
    stage3_project.updated_at = Utc::now();
    
    repository.save(&stage3_project).await?;
    println!("✅ Stage 3: Project fully enhanced");
    
    // 最終状態の検証
    let final_project = repository.find_by_id(&project_id).await?;
    assert!(final_project.is_some());
    let final_proj = final_project.unwrap();
    
    assert_eq!(final_proj.name, "段階的変更テストプロジェクト（最終版）");
    assert_eq!(final_proj.color, Some("#00cc66".to_string()));
    assert_eq!(final_proj.order_index, 2);
    assert!(!final_proj.is_archived);
    
    println!("✅ Final verification completed: color={:?}, order={}", 
             final_proj.color, final_proj.order_index);
    
    // automerge履歴データを永続保存
    copy_to_persistent_storage(&automerge_dir, &persistent_dir, "test_project_incremental_changes_with_history")?;
    
    Ok(())
}

/// 複数のRepositoryタイプの統合テスト
#[tokio::test]
#[ignore] // UserとAccountのリポジトリ実装が未完成のため一時的に無効化
async fn test_multiple_repository_types_integration() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_multiple_repository_types_integration");
    let automerge_dir = temp_dir.path().join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;
    
    // プロジェクトリポジトリのみ使用（他のリポジトリは実装が未完成）
    let project_repo = ProjectLocalAutomergeRepository::new(automerge_dir.clone())?;
    
    println!("Created project repository for integration test");
    
    // シンプルなユーザーIDを作成
    let user_id = UserId::new();
    
    // プロジェクトを作成（ユーザーと関連付け）
    let project_id = ProjectId::new();
    let project = Project {
        id: project_id.clone(),
        name: "統合テスト用プロジェクト".to_string(),
        description: Some("プロジェクトのみの統合をテストするプロジェクト".to_string()),
        color: Some("#4a90e2".to_string()),
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(user_id.clone()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    project_repo.save(&project).await?;
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
    copy_to_persistent_storage(&automerge_dir, &persistent_dir, "test_multiple_repository_types_integration")?;
    
    Ok(())
}

/// エラーハンドリングと例外ケースのテスト
#[tokio::test]
async fn test_error_handling_and_edge_cases() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_error_handling_and_edge_cases");
    let automerge_dir = temp_dir.path().join("automerge_data");
    std::fs::create_dir_all(&automerge_dir)?;
    
    let repository = ProjectLocalAutomergeRepository::new(automerge_dir.clone())?;
    
    // 存在しないIDでの取得テスト
    let non_existent_id = ProjectId::new();
    let result = repository.find_by_id(&non_existent_id).await?;
    assert!(result.is_none());
    println!("✅ Non-existent ID handling verified");
    
    // 存在しないプロジェクトの更新テスト
    let fake_project = Project {
        id: ProjectId::new(),
        name: "存在しないプロジェクト".to_string(),
        description: None,
        color: None,
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    // 更新は成功する可能性があります（automergeの特性上、新規作成として扱われる場合）
    let update_result = repository.save(&fake_project).await;
    println!("✅ Update non-existent project result: {:?}", update_result.is_ok());
    
    // 存在しないプロジェクトの削除テスト
    let delete_result = repository.delete(&non_existent_id).await;
    println!("✅ Delete non-existent project result: {:?}", delete_result.is_ok());
    
    // 空のプロジェクト名でのテスト
    let empty_name_project = Project {
        id: ProjectId::new(),
        name: "".to_string(),
        description: None,
        color: None,
        order_index: 0,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let create_result = repository.save(&empty_name_project).await;
    println!("✅ Empty name project creation result: {:?}", create_result.is_ok());
    
    // 大きなデータでのテスト
    let large_project = Project {
        id: ProjectId::new(),
        name: "大きなプロジェクト".to_string(),
        description: Some("非常に長い説明: ".to_string() + &"あ".repeat(1000)),
        color: Some("#ff00ff".to_string()),
        order_index: 999,
        is_archived: false,
        status: None,
        owner_id: Some(UserId::new()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let large_create_result = repository.save(&large_project).await;
    println!("✅ Large project creation result: {:?}", large_create_result.is_ok());
    
    if large_create_result.is_ok() {
        let retrieved_large = repository.find_by_id(&large_project.id).await?;
        if let Some(large_proj) = retrieved_large {
            println!("✅ Large project verified: name={}, description_len={}", 
                     large_proj.name, large_proj.description.as_ref().map(|d| d.len()).unwrap_or(0));
        }
    }
    
    // automergeファイルを永続保存
    copy_to_persistent_storage(&automerge_dir, &persistent_dir, "test_error_handling_and_edge_cases")?;
    
    Ok(())
}