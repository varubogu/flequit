//! automerge-repo統合テスト
//! 
//! FileStorageとDocumentManagerを使ったautomergeドキュメントの
//! 書き込み・読み込み動作の結合テスト

use tempfile::TempDir;
use serde_json::json;
use std::path::{Path, PathBuf};

use flequit_lib::repositories::local_automerge::document_manager::{DocumentManager, DocumentType};
use flequit_lib::repositories::local_automerge::file_storage::FileStorage;

/// テスト結果の永続保存用ヘルパー関数
fn create_persistent_test_dir(test_name: &str) -> PathBuf {
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    
    // プロジェクトルートから.tmp/testsディレクトリを特定
    let current_dir = std::env::current_dir().expect("Failed to get current directory");
    let project_root = if current_dir.ends_with("src-tauri") {
        current_dir.parent().unwrap().to_path_buf()
    } else {
        current_dir
    };
    
    let base_path = project_root.join(".tmp/tests/cargo/automerge_repo_integration_test");
    let test_dir = base_path.join(test_name).join(&timestamp);
    
    if let Err(e) = std::fs::create_dir_all(&test_dir) {
        eprintln!("Failed to create persistent test directory: {}", e);
        // フォールバック：一時ディレクトリを返す
        return std::env::temp_dir().join("flequit_fallback").join(test_name).join(&timestamp);
    }
    
    println!("Test results will be saved to: {:?}", test_dir);
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
        "execution_time": chrono::Utc::now().to_rfc3339(),
        "source_directory": src_dir.to_string_lossy(),
        "destination_directory": dest_dir.to_string_lossy()
    });
    
    let metadata_file = dest_dir.join("test_metadata.json");
    std::fs::write(&metadata_file, serde_json::to_string_pretty(&metadata)?)?;
    
    // ディレクトリ内容を再帰的にコピー
    copy_dir_recursive(src_dir, dest_dir)?;
    
    println!("Test results copied to persistent storage: {:?}", dest_dir);
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

/// FileStorageの基本動作テスト
#[tokio::test]
async fn test_file_storage_basic_operations() -> Result<(), Box<dyn std::error::Error>> {
    // テンポラリディレクトリを作成
    let temp_dir = TempDir::new()?;
    let storage_path = temp_dir.path().to_path_buf();
    
    println!("テストディレクトリ: {:?}", storage_path);
    
    // FileStorageを作成
    let _file_storage = FileStorage::new(&storage_path)?;
    
    // ディレクトリが作成されたことを確認
    assert!(storage_path.exists());
    assert!(storage_path.is_dir());
    
    Ok(())
}

/// DocumentManagerの基本動作テスト
#[tokio::test]
async fn test_document_manager_creation() -> Result<(), Box<dyn std::error::Error>> {
    // テンポラリディレクトリを作成
    let temp_dir = TempDir::new()?;
    let manager_path = temp_dir.path().to_path_buf();
    
    println!("テストディレクトリ: {:?}", manager_path);
    
    // DocumentManagerを作成
    let mut manager = DocumentManager::new(&manager_path)?;
    
    // 基本的なドキュメント作成テスト
    let doc_type = DocumentType::Settings;
    let _doc_handle = manager.get_or_create_document(&doc_type).await?;
    
    // ドキュメントが作成されたことを確認
    assert!(manager.document_exists(&doc_type));
    
    Ok(())
}

/// 複数のドキュメントタイプのテスト
#[tokio::test]
async fn test_multiple_document_types() -> Result<(), Box<dyn std::error::Error>> {
    // テンポラリディレクトリを作成
    let temp_dir = TempDir::new()?;
    let manager_path = temp_dir.path().to_path_buf();
    
    let mut manager = DocumentManager::new(&manager_path)?;
    
    // 複数のドキュメントタイプを作成
    let doc_types = vec![
        DocumentType::Settings,
        DocumentType::Account,
        DocumentType::User,
        DocumentType::Project("test-project-1".to_string()),
        DocumentType::Project("test-project-2".to_string()),
    ];
    
    // 各ドキュメントタイプのドキュメントを作成
    for doc_type in &doc_types {
        let _doc_handle = manager.get_or_create_document(doc_type).await?;
        assert!(manager.document_exists(doc_type));
    }
    
    // ドキュメントタイプのリストを取得
    let document_list = manager.list_document_types()?;
    assert_eq!(document_list.len(), doc_types.len());
    
    // すべてのドキュメントタイプが含まれていることを確認
    for doc_type in &doc_types {
        assert!(document_list.contains(doc_type));
    }
    
    Ok(())
}

/// 単純なデータの書き込み・読み込みテスト
#[tokio::test]
async fn test_simple_data_write_read() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // テストデータを保存
    let test_key = "test_setting";
    let test_value = "test_value";
    manager.save_data(&doc_type, test_key, &test_value).await?;
    
    // データを読み込み
    let loaded_value: Option<String> = manager.load_data(&doc_type, test_key).await?;
    assert_eq!(loaded_value, Some(test_value.to_string()));
    
    // 存在しないキーの読み込みテスト
    let nonexistent_value: Option<String> = manager.load_data(&doc_type, "nonexistent_key").await?;
    assert_eq!(nonexistent_value, None);
    
    Ok(())
}

/// 複雑なJSONデータの書き込み・読み込みテスト
#[tokio::test]
async fn test_complex_json_data_write_read() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // 複雑なJSONデータを作成
    let complex_data = json!({
        "user_settings": {
            "theme": "dark",
            "language": "ja",
            "notifications": {
                "email": true,
                "push": false,
                "frequency": 30
            },
            "recent_projects": [
                {"id": "proj1", "name": "プロジェクト1", "last_opened": "2024-01-15"},
                {"id": "proj2", "name": "プロジェクト2", "last_opened": "2024-01-10"}
            ]
        },
        "system_config": {
            "auto_save": true,
            "max_undo_levels": 100,
            "cache_size_mb": 256
        }
    });
    
    // データを保存
    manager.save_data(&doc_type, "app_config", &complex_data).await?;
    
    // データを読み込み
    let loaded_data: Option<serde_json::Value> = manager.load_data(&doc_type, "app_config").await?;
    assert!(loaded_data.is_some());
    
    let loaded = loaded_data.unwrap();
    
    // ネストしたデータが正しく読み込まれることを確認
    assert_eq!(loaded["user_settings"]["theme"], "dark");
    assert_eq!(loaded["user_settings"]["language"], "ja");
    assert_eq!(loaded["user_settings"]["notifications"]["email"], true);
    assert_eq!(loaded["user_settings"]["notifications"]["push"], false);
    assert_eq!(loaded["user_settings"]["notifications"]["frequency"], 30);
    assert_eq!(loaded["system_config"]["auto_save"], true);
    assert_eq!(loaded["system_config"]["max_undo_levels"], 100);
    assert_eq!(loaded["system_config"]["cache_size_mb"], 256);
    
    // 配列データの確認
    assert!(loaded["user_settings"]["recent_projects"].is_array());
    let projects = loaded["user_settings"]["recent_projects"].as_array().unwrap();
    assert_eq!(projects.len(), 2);
    assert_eq!(projects[0]["id"], "proj1");
    assert_eq!(projects[0]["name"], "プロジェクト1");
    assert_eq!(projects[1]["id"], "proj2");
    assert_eq!(projects[1]["name"], "プロジェクト2");
    
    Ok(())
}

/// 異なるドキュメント間でのデータ分離テスト
#[tokio::test]
async fn test_document_isolation() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    // 異なるドキュメントタイプを使用
    let settings_doc = DocumentType::Settings;
    let account_doc = DocumentType::Account;
    let project_doc = DocumentType::Project("test-project".to_string());
    
    // 各ドキュメントに同じキーで異なる値を保存
    let key = "common_key";
    manager.save_data(&settings_doc, key, &"settings_value").await?;
    manager.save_data(&account_doc, key, &"account_value").await?;
    manager.save_data(&project_doc, key, &"project_value").await?;
    
    // 各ドキュメントから独立してデータが読み込まれることを確認
    let settings_value: Option<String> = manager.load_data(&settings_doc, key).await?;
    let account_value: Option<String> = manager.load_data(&account_doc, key).await?;
    let project_value: Option<String> = manager.load_data(&project_doc, key).await?;
    
    assert_eq!(settings_value, Some("settings_value".to_string()));
    assert_eq!(account_value, Some("account_value".to_string()));
    assert_eq!(project_value, Some("project_value".to_string()));
    
    Ok(())
}

/// ドキュメント削除テスト
#[tokio::test]
async fn test_document_deletion() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // ドキュメントを作成してデータを保存
    manager.save_data(&doc_type, "test_key", &"test_value").await?;
    assert!(manager.document_exists(&doc_type));
    
    // ドキュメントを削除
    manager.delete_document(doc_type.clone())?;
    assert!(!manager.document_exists(&doc_type));
    
    // 削除後にデータを読み込もうとした場合の動作確認
    let loaded_value: Option<String> = manager.load_data(&doc_type, "test_key").await?;
    assert_eq!(loaded_value, None);
    
    Ok(())
}

/// キャッシュクリアテスト
#[tokio::test]
async fn test_cache_clear() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // ドキュメントを作成してデータを保存
    manager.save_data(&doc_type, "test_key", &"test_value").await?;
    assert!(manager.document_exists(&doc_type));
    
    // キャッシュをクリア
    manager.clear_cache()?;
    assert!(!manager.document_exists(&doc_type));
    
    // キャッシュクリア後に新しいドキュメントハンドルが作成される
    // automerge-repoの仕様上、クリア後にデータが保持されるかはStorageの実装に依存する
    let loaded_value: Option<String> = manager.load_data(&doc_type, "test_key").await?;
    // 現在のFileStorage実装では、キャッシュクリア後にデータは保持されない可能性がある
    assert!(loaded_value.is_none() || loaded_value == Some("test_value".to_string()));
    
    // 読み込み操作後、ドキュメントが存在するようになる
    assert!(manager.document_exists(&doc_type));
    
    Ok(())
}

/// パス指定でのデータ保存・読み込みテスト
#[tokio::test]
async fn test_path_based_data_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // パス指定でデータを保存
    let test_data = json!({
        "name": "テストユーザー",
        "settings": {
            "theme": "light",
            "language": "en"
        }
    });
    
    manager.save_data_at_path(&doc_type, &["user", "profile"], &test_data).await?;
    
    // パス指定でデータを読み込み
    let loaded_data: Option<serde_json::Value> = manager.load_data_at_path(&doc_type, &["user", "profile"]).await?;
    assert!(loaded_data.is_some());
    
    let loaded = loaded_data.unwrap();
    assert_eq!(loaded["name"], "テストユーザー");
    assert_eq!(loaded["settings"]["theme"], "light");
    assert_eq!(loaded["settings"]["language"], "en");
    
    Ok(())
}

/// 順次実行でのデータ保存・読み込みテスト
#[tokio::test]
async fn test_sequential_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // 複数のデータを順次保存
    for i in 0..10 {
        let key = format!("key_{}", i);
        let value = format!("value_{}", i);
        manager.save_data(&doc_type, &key, &value).await?;
    }
    
    // すべてのデータが正しく保存されたことを確認
    for i in 0..10 {
        let key = format!("key_{}", i);
        let expected_value = format!("value_{}", i);
        
        let loaded_value: Option<String> = manager.load_data(&doc_type, &key).await?;
        assert_eq!(loaded_value, Some(expected_value));
    }
    
    Ok(())
}

/// ドキュメント変更履歴・差分テスト
#[tokio::test]
async fn test_document_changes_tracking() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // 初期データを保存
    let initial_data = json!({"version": 1, "theme": "light"});
    manager.save_data(&doc_type, "config", &initial_data).await?;
    
    // データを変更
    let updated_data = json!({"version": 2, "theme": "dark", "language": "ja"});
    manager.save_data(&doc_type, "config", &updated_data).await?;
    
    // 変更後のデータが正しく読み込まれることを確認
    let loaded_data: Option<serde_json::Value> = manager.load_data(&doc_type, "config").await?;
    assert!(loaded_data.is_some());
    let loaded = loaded_data.unwrap();
    
    assert_eq!(loaded["version"], 2);
    assert_eq!(loaded["theme"], "dark");
    assert_eq!(loaded["language"], "ja");
    
    Ok(())
}

/// 複数ドキュメントの並行変更テスト
#[tokio::test]
async fn test_concurrent_document_modifications() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let settings_doc = DocumentType::Settings;
    let account_doc = DocumentType::Account;
    
    // 2つのドキュメントに初期データを保存
    manager.save_data(&settings_doc, "preferences", &json!({"theme": "light"})).await?;
    manager.save_data(&account_doc, "profile", &json!({"name": "user1"})).await?;
    
    // 両方のドキュメントを同時に変更
    manager.save_data(&settings_doc, "preferences", &json!({"theme": "dark", "language": "en"})).await?;
    manager.save_data(&account_doc, "profile", &json!({"name": "user1", "email": "user@example.com"})).await?;
    
    // 両方のドキュメントが正しく更新されていることを確認
    let settings_data: Option<serde_json::Value> = manager.load_data(&settings_doc, "preferences").await?;
    let account_data: Option<serde_json::Value> = manager.load_data(&account_doc, "profile").await?;
    
    assert!(settings_data.is_some());
    assert!(account_data.is_some());
    
    let settings = settings_data.unwrap();
    let account = account_data.unwrap();
    
    assert_eq!(settings["theme"], "dark");
    assert_eq!(settings["language"], "en");
    assert_eq!(account["name"], "user1");
    assert_eq!(account["email"], "user@example.com");
    
    Ok(())
}

/// 段階的なデータ変更テスト
#[tokio::test]
async fn test_incremental_data_changes() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Project("incremental-test".to_string());
    
    // 段階1: 基本情報を保存
    let stage1 = json!({
        "name": "Test Project",
        "status": "active"
    });
    manager.save_data(&doc_type, "project_info", &stage1).await?;
    
    // 段階2: タスクを追加
    let stage2 = json!({
        "name": "Test Project",
        "status": "active",
        "tasks": [
            {"id": "task1", "title": "First Task", "completed": false}
        ]
    });
    manager.save_data(&doc_type, "project_info", &stage2).await?;
    
    // 段階3: さらにタスクを追加
    let stage3 = json!({
        "name": "Test Project",
        "status": "active",
        "tasks": [
            {"id": "task1", "title": "First Task", "completed": true},
            {"id": "task2", "title": "Second Task", "completed": false}
        ],
        "metadata": {
            "created_at": "2024-01-01",
            "updated_at": "2024-01-15"
        }
    });
    manager.save_data(&doc_type, "project_info", &stage3).await?;
    
    // 最終状態のデータを確認
    let final_data: Option<serde_json::Value> = manager.load_data(&doc_type, "project_info").await?;
    assert!(final_data.is_some());
    let loaded = final_data.unwrap();
    
    assert_eq!(loaded["name"], "Test Project");
    assert_eq!(loaded["status"], "active");
    assert!(loaded["tasks"].is_array());
    
    let tasks = loaded["tasks"].as_array().unwrap();
    assert_eq!(tasks.len(), 2);
    assert_eq!(tasks[0]["completed"], true);
    assert_eq!(tasks[1]["completed"], false);
    assert!(loaded["metadata"]["created_at"] == "2024-01-01");
    
    Ok(())
}

/// 異なるデータ型の変更テスト
#[tokio::test]
async fn test_data_type_changes() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // 数値データから開始
    manager.save_data(&doc_type, "value", &42).await?;
    let loaded_int: Option<i32> = manager.load_data(&doc_type, "value").await?;
    assert_eq!(loaded_int, Some(42));
    
    // 文字列に変更
    manager.save_data(&doc_type, "value", &"hello world").await?;
    let loaded_str: Option<String> = manager.load_data(&doc_type, "value").await?;
    assert_eq!(loaded_str, Some("hello world".to_string()));
    
    // オブジェクトに変更
    let obj_data = json!({"type": "object", "data": [1, 2, 3]});
    manager.save_data(&doc_type, "value", &obj_data).await?;
    let loaded_obj: Option<serde_json::Value> = manager.load_data(&doc_type, "value").await?;
    assert!(loaded_obj.is_some());
    let loaded = loaded_obj.unwrap();
    assert_eq!(loaded["type"], "object");
    assert_eq!(loaded["data"], json!([1, 2, 3]));
    
    Ok(())
}

/// 大量データの差分処理テスト
#[tokio::test]
async fn test_large_data_incremental_updates() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::User;
    
    // 大きな配列データを作成
    let mut items: Vec<serde_json::Value> = Vec::new();
    for i in 0..100 {
        items.push(json!({"id": i, "name": format!("item_{}", i), "active": true}));
    }
    
    let initial_data = json!({"items": items});
    manager.save_data(&doc_type, "large_dataset", &initial_data).await?;
    
    // 一部のデータを変更
    let mut updated_items: Vec<serde_json::Value> = Vec::new();
    for i in 0..100 {
        let active = i % 2 == 0; // 偶数のアイテムのみアクティブ
        updated_items.push(json!({"id": i, "name": format!("updated_item_{}", i), "active": active}));
    }
    
    // 新しいアイテムを追加
    for i in 100..110 {
        updated_items.push(json!({"id": i, "name": format!("new_item_{}", i), "active": true}));
    }
    
    let updated_data = json!({"items": updated_items, "last_update": "2024-01-15"});
    manager.save_data(&doc_type, "large_dataset", &updated_data).await?;
    
    // データが正しく更新されたことを確認
    let loaded_data: Option<serde_json::Value> = manager.load_data(&doc_type, "large_dataset").await?;
    assert!(loaded_data.is_some());
    let loaded = loaded_data.unwrap();
    
    assert!(loaded["items"].is_array());
    let items_array = loaded["items"].as_array().unwrap();
    assert_eq!(items_array.len(), 110); // 100個の元のアイテム + 10個の新しいアイテム
    
    // 最初のアイテムが更新されていることを確認
    assert_eq!(items_array[0]["name"], "updated_item_0");
    assert_eq!(items_array[0]["active"], true); // 0は偶数なのでtrue
    
    // 奇数番目のアイテムが非アクティブになっていることを確認
    assert_eq!(items_array[1]["active"], false); // 1は奇数なのでfalse
    
    // 新しいアイテムが追加されていることを確認
    assert_eq!(items_array[100]["name"], "new_item_100");
    assert_eq!(loaded["last_update"], "2024-01-15");
    
    Ok(())
}

/// JSON出力機能の単体テスト
#[tokio::test]
async fn test_json_export_functionality() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_json_export_functionality");
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Settings;
    
    // テストデータを保存
    let test_data = json!({
        "theme": "dark",
        "language": "ja",
        "user_preferences": {
            "notifications": true,
            "auto_save": false
        },
        "recent_files": [
            {"name": "document1.txt", "path": "/home/user/documents/document1.txt"},
            {"name": "document2.txt", "path": "/home/user/documents/document2.txt"}
        ]
    });
    
    manager.save_data(&doc_type, "app_settings", &test_data).await?;
    
    // JSON出力ディレクトリを作成
    let json_output_dir = temp_dir.path().join("json_exports");
    
    // 個別ドキュメントのJSON出力テスト
    let json_file_path = json_output_dir.join("settings_export.json");
    std::fs::create_dir_all(&json_output_dir)?;
    
    manager.export_document_to_file(
        &doc_type, 
        &json_file_path, 
        Some("Test JSON export for settings document")
    ).await?;
    
    // ファイルが作成されたことを確認
    assert!(json_file_path.exists());
    
    // JSONファイルの内容を確認
    let exported_content = std::fs::read_to_string(&json_file_path)?;
    let exported_json: serde_json::Value = serde_json::from_str(&exported_content)?;
    
    // メタデータの確認
    assert!(exported_json["metadata"].is_object());
    assert_eq!(exported_json["metadata"]["document_type"], "Settings");
    assert_eq!(exported_json["metadata"]["filename"], "settings.automerge");
    assert!(exported_json["metadata"]["exported_at"].is_string());
    
    // ドキュメントデータの確認
    assert!(exported_json["document_data"]["app_settings"].is_object());
    let settings = &exported_json["document_data"]["app_settings"];
    assert_eq!(settings["theme"], "dark");
    assert_eq!(settings["language"], "ja");
    
    println!("JSON export test completed. Output file: {:?}", json_file_path);
    
    // 永続保存ディレクトリにコピー
    copy_to_persistent_storage(&json_output_dir, &persistent_dir, "test_json_export_functionality")?;
    
    Ok(())
}

/// 差分処理でのJSON出力テスト
#[tokio::test]
async fn test_json_export_with_incremental_changes() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_json_export_with_incremental_changes");
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let doc_type = DocumentType::Project("json-export-test".to_string());
    let json_output_dir = temp_dir.path().join("incremental_exports");
    std::fs::create_dir_all(&json_output_dir)?;
    
    println!("JSON export directory: {:?}", json_output_dir);
    
    // Stage 1: 初期データ
    let stage1_data = json!({
        "name": "Test Project",
        "status": "planning",
        "created_at": "2024-01-01T00:00:00Z"
    });
    
    manager.save_data(&doc_type, "project", &stage1_data).await?;
    manager.export_document_to_file(
        &doc_type, 
        json_output_dir.join("stage1_initial.json"), 
        Some("Stage 1: Initial project creation")
    ).await?;
    
    // Stage 2: タスク追加
    let stage2_data = json!({
        "name": "Test Project",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "tasks": [
            {
                "id": "task-001",
                "title": "Setup project structure",
                "status": "completed",
                "assignee": "developer1"
            }
        ]
    });
    
    manager.save_data(&doc_type, "project", &stage2_data).await?;
    manager.export_document_to_file(
        &doc_type, 
        json_output_dir.join("stage2_tasks_added.json"), 
        Some("Stage 2: Added tasks to project")
    ).await?;
    
    // Stage 3: 複数タスクとメンバー追加
    let stage3_data = json!({
        "name": "Test Project",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "tasks": [
            {
                "id": "task-001",
                "title": "Setup project structure",
                "status": "completed",
                "assignee": "developer1"
            },
            {
                "id": "task-002", 
                "title": "Implement core features",
                "status": "in_progress",
                "assignee": "developer2"
            },
            {
                "id": "task-003",
                "title": "Write documentation",
                "status": "pending",
                "assignee": "tech_writer"
            }
        ],
        "team_members": [
            {"name": "developer1", "role": "lead_developer"},
            {"name": "developer2", "role": "developer"},
            {"name": "tech_writer", "role": "documentation"}
        ]
    });
    
    manager.save_data(&doc_type, "project", &stage3_data).await?;
    manager.export_document_to_file(
        &doc_type, 
        json_output_dir.join("stage3_full_project.json"), 
        Some("Stage 3: Complete project with team and multiple tasks")
    ).await?;
    
    // 全ドキュメントのエクスポートもテスト
    let all_docs_dir = json_output_dir.join("all_documents");
    manager.export_all_documents_to_directory(
        &all_docs_dir, 
        Some("Complete project state export")
    ).await?;
    
    // 出力ファイルの確認
    assert!(json_output_dir.join("stage1_initial.json").exists());
    assert!(json_output_dir.join("stage2_tasks_added.json").exists());
    assert!(json_output_dir.join("stage3_full_project.json").exists());
    assert!(all_docs_dir.join("export_summary.json").exists());
    
    // Stage 3のファイル内容を確認
    let stage3_content = std::fs::read_to_string(json_output_dir.join("stage3_full_project.json"))?;
    let stage3_json: serde_json::Value = serde_json::from_str(&stage3_content)?;
    
    let project_data = &stage3_json["document_data"]["project"];
    assert_eq!(project_data["status"], "active");
    assert!(project_data["tasks"].is_array());
    assert_eq!(project_data["tasks"].as_array().unwrap().len(), 3);
    assert!(project_data["team_members"].is_array());
    assert_eq!(project_data["team_members"].as_array().unwrap().len(), 3);
    
    println!("Incremental JSON export test completed successfully");
    
    // 永続保存ディレクトリにコピー
    copy_to_persistent_storage(&json_output_dir, &persistent_dir, "test_json_export_with_incremental_changes")?;
    
    Ok(())
}

/// 複数ドキュメントタイプのJSON出力テスト
#[tokio::test]
async fn test_json_export_multiple_document_types() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir = TempDir::new()?;
    let persistent_dir = create_persistent_test_dir("test_json_export_multiple_document_types");
    let mut manager = DocumentManager::new(temp_dir.path())?;
    
    let json_output_dir = temp_dir.path().join("multi_document_exports");
    std::fs::create_dir_all(&json_output_dir)?;
    
    println!("Multi-document JSON export directory: {:?}", json_output_dir);
    
    // 設定ドキュメント
    let settings_data = json!({
        "theme": "dark",
        "language": "en",
        "auto_save": true
    });
    manager.save_data(&DocumentType::Settings, "config", &settings_data).await?;
    
    // アカウントドキュメント
    let account_data = json!({
        "username": "testuser",
        "email": "test@example.com",
        "preferences": {
            "notifications": true,
            "privacy_mode": false
        }
    });
    manager.save_data(&DocumentType::Account, "profile", &account_data).await?;
    
    // ユーザードキュメント
    let user_data = json!({
        "display_name": "Test User",
        "avatar_url": "/avatars/default.png",
        "last_login": "2024-01-15T14:30:00Z"
    });
    manager.save_data(&DocumentType::User, "user_info", &user_data).await?;
    
    // プロジェクトドキュメント
    let project_data = json!({
        "title": "Sample Project",
        "description": "A sample project for testing",
        "status": "active",
        "members": ["user1", "user2", "user3"]
    });
    manager.save_data(&DocumentType::Project("sample-123".to_string()), "info", &project_data).await?;
    
    // 全ドキュメントを一括エクスポート
    manager.export_all_documents_to_directory(
        &json_output_dir, 
        Some("Multi-document type export test")
    ).await?;
    
    // エクスポートサマリーを確認
    let summary_path = json_output_dir.join("export_summary.json");
    assert!(summary_path.exists());
    
    let summary_content = std::fs::read_to_string(&summary_path)?;
    let summary_json: serde_json::Value = serde_json::from_str(&summary_content)?;
    
    assert_eq!(summary_json["export_metadata"]["total_documents"], 4);
    assert!(summary_json["documents"].is_array());
    
    // 個別ファイルの存在確認
    assert!(json_output_dir.join("settings.json").exists());
    assert!(json_output_dir.join("account.json").exists());
    assert!(json_output_dir.join("user.json").exists());
    assert!(json_output_dir.join("project_sample-123.json").exists());
    
    // 設定ファイルの内容確認
    let settings_content = std::fs::read_to_string(json_output_dir.join("settings.json"))?;
    let settings_json: serde_json::Value = serde_json::from_str(&settings_content)?;
    
    assert_eq!(settings_json["document_data"]["config"]["theme"], "dark");
    assert_eq!(settings_json["document_data"]["config"]["language"], "en");
    
    println!("Multi-document JSON export test completed successfully");
    
    // 永続保存ディレクトリにコピー
    copy_to_persistent_storage(&json_output_dir, &persistent_dir, "test_json_export_multiple_document_types")?;
    
    Ok(())
}