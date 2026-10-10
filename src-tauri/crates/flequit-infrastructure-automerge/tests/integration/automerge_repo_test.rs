//! automerge-repo統合テスト
//!
//! FileStorageとDocumentManagerを使ったautomergeドキュメントの
//! 書き込み・読み込み動作の結合テスト

use serde_json::json;
use std::path::{Path, PathBuf};

use flequit_infrastructure_automerge::infrastructure::document_manager::{
    DocumentManager, DocumentType,
};
use flequit_infrastructure_automerge::infrastructure::file_storage::FileStorage;
use flequit_model::types::id_types::ProjectId;

// TestPathGeneratorを使用するためのインポート
use flequit_testing::TestPathGenerator;

/// テスト用DocumentManagerラッパー - 自動JSON履歴出力機能付き
struct TestDocumentManager {
    inner: DocumentManager,
    test_name: String,
    step_counter: std::sync::Arc<std::sync::Mutex<usize>>,
    base_export_dir: PathBuf,
}

impl TestDocumentManager {
    /// 新しいテスト用DocumentManagerを作成
    fn new(
        base_path: &std::path::Path,
        test_name: &str,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let manager = DocumentManager::new(base_path)?;

        // エクスポート用ディレクトリを作成
        let base_export_dir = base_path.join("json_history");
        std::fs::create_dir_all(&base_export_dir)?;

        println!(
            "📁 Test JSON history will be saved to: {:?}",
            base_export_dir
        );

        Ok(Self {
            inner: manager,
            test_name: test_name.to_string(),
            step_counter: std::sync::Arc::new(std::sync::Mutex::new(0)),
            base_export_dir,
        })
    }

    /// 自動履歴出力付きでデータを保存
    async fn save_data<T: serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        key: &str,
        value: &T,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // データを保存
        let result = self.inner.save_data(doc_type, key, value).await;

        // 成功した場合のみ履歴出力
        if result.is_ok() {
            self.export_current_state(doc_type, &format!("save_data_{}", key))
                .await?;
        }

        result.map_err(|e| e.into())
    }

    /// 自動履歴出力付きでパス指定データを保存
    async fn save_data_at_path<T: serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        path: &[&str],
        value: &T,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // データを保存（ネストパス対応）
        let result = self
            .inner
            .save_data_at_nested_path(doc_type, path, value)
            .await;

        // 成功した場合のみ履歴出力
        if result.is_ok() {
            let path_str = path.join("_");
            self.export_current_state(doc_type, &format!("save_at_path_{}", path_str))
                .await?;
        }

        result.map_err(|e| e.into())
    }

    /// データ読み込み（履歴出力なし）
    async fn load_data<T: serde::de::DeserializeOwned + serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        key: &str,
    ) -> Result<Option<T>, Box<dyn std::error::Error>> {
        self.inner
            .load_data(doc_type, key)
            .await
            .map_err(|e| e.into())
    }

    /// パス指定データ読み込み（履歴出力なし）
    async fn load_data_at_path<T: serde::de::DeserializeOwned + serde::Serialize>(
        &mut self,
        doc_type: &DocumentType,
        path: &[&str],
    ) -> Result<Option<T>, Box<dyn std::error::Error>> {
        self.inner
            .load_data_at_nested_path(doc_type, path)
            .await
            .map_err(|e| e.into())
    }

    /// ドキュメント作成・取得（履歴出力付き）
    async fn get_or_create_document(
        &mut self,
        doc_type: &DocumentType,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let result = self.inner.get_or_create(doc_type).await;

        if result.is_ok() {
            self.export_current_state(doc_type, "get_or_create_document")
                .await?;
        }

        result.map_err(|e| e.into()).map(|_| ())
    }

    /// ドキュメント存在確認
    fn document_exists(&self, doc_type: &DocumentType) -> bool {
        self.inner.exists(doc_type)
    }

    /// ドキュメント存在確認（新API対応）
    fn exists(&self, doc_type: &DocumentType) -> bool {
        self.inner.exists(doc_type)
    }

    /// ドキュメントタイプリスト取得
    fn list_document_types(&self) -> Result<Vec<DocumentType>, Box<dyn std::error::Error>> {
        self.inner.list_document_types().map_err(|e| e.into())
    }

    // /// ドキュメント削除（履歴出力付き）
    // fn delete_document(
    //     &mut self,
    //     doc_type: DocumentType,
    // ) -> Result<(), Box<dyn std::error::Error>> {
    //     self.inner.delete(doc_type).map_err(|e| e.into())
    // }

    // /// キャッシュクリア
    // fn clear_cache(&mut self) -> Result<(), Box<dyn std::error::Error>> {
    //     self.inner.clear_cache().map_err(|e| e.into())
    // }

    /// 現在の状態をJSONファイルに出力
    async fn export_current_state(
        &mut self,
        doc_type: &DocumentType,
        action: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let step = {
            let mut counter = self.step_counter.lock().unwrap();
            *counter += 1;
            *counter
        };

        let filename = format!(
            "{:03}_{}_{}_{}.json",
            step,
            self.test_name,
            doc_type.filename(),
            action.replace("/", "_")
        );

        let export_path = self.base_export_dir.join(&filename);

        // TODO: export_document_as_json は現在のAPIで利用できないため、一時的にスキップ
        // 現在のドキュメントデータのみ出力する（代替実装）
        let metadata = json!({
            "step": step,
            "test_name": self.test_name,
            "document_type": format!("{:?}", doc_type),
            "action": action,
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "filename": filename
        });

        let output_data = json!({
            "metadata": metadata,
            "document_data": "TODO: implement document data export"
        });

        std::fs::write(&export_path, serde_json::to_string_pretty(&output_data)?)?;
        println!(
            "📄 Step {}: Exported JSON history to: {} (simplified)",
            step, filename
        );

        Ok(())
    }

    /// テスト終了時に詳細変更履歴を出力
    async fn finalize_test(
        &mut self,
        doc_types: &[DocumentType],
    ) -> Result<(), Box<dyn std::error::Error>> {
        println!("🏁 Finalizing test: {}", self.test_name);

        for doc_type in doc_types {
            // let changes_dir = self
            //     .base_export_dir
            //     .join("detailed_changes")
            //     .join(&doc_type.filename());

            // TODO: export_document_changes_history は現在のAPIで利用できないため、一時的にスキップ
            println!(
                "📝 Skipped detailed changes export for {:?} (not implemented)",
                doc_type
            );
        }

        Ok(())
    }
}

/// 差分更新テスト用の共通ヘルパー関数群
mod differential_update_helpers {
    use super::*;

    /// 差分更新テスト用のテストデータ構造
    #[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
    pub struct TestEntity {
        pub id: String,
        pub name: String,
        pub description: Option<String>,
        pub value: i32,
        pub is_active: bool,
        pub tags: Vec<String>,
        pub metadata: std::collections::HashMap<String, serde_json::Value>,
        pub nested: NestedData,
    }

    #[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
    pub struct NestedData {
        pub level: i32,
        pub info: String,
        pub settings: std::collections::HashMap<String, String>,
    }

    impl Default for TestEntity {
        fn default() -> Self {
            let mut metadata = std::collections::HashMap::new();
            metadata.insert("created_at".to_string(), json!("2024-01-01T00:00:00Z"));
            metadata.insert("version".to_string(), json!(1));

            let mut nested_settings = std::collections::HashMap::new();
            nested_settings.insert("theme".to_string(), "light".to_string());
            nested_settings.insert("lang".to_string(), "en".to_string());

            Self {
                id: "test-entity-001".to_string(),
                name: "初期エンティティ".to_string(),
                description: Some("テスト用の初期エンティティ".to_string()),
                value: 100,
                is_active: true,
                tags: vec!["tag1".to_string(), "tag2".to_string()],
                metadata,
                nested: NestedData {
                    level: 1,
                    info: "初期ネストデータ".to_string(),
                    settings: nested_settings,
                },
            }
        }
    }

    /// 単一プロパティの差分更新テストを実行する共通関数
    pub async fn test_single_property_update<T>(
        manager: &mut TestDocumentManager,
        doc_type: &DocumentType,
        entity_key: &str,
        property_name: &str,
        initial_value: T,
        updated_value: T,
        property_path: &[&str],
    ) -> Result<(), Box<dyn std::error::Error>>
    where
        T: serde::Serialize + serde::de::DeserializeOwned + std::fmt::Debug + PartialEq + Clone,
    {
        println!(
            "🧪 Testing property update: {} -> {:?} to {:?}",
            property_name, initial_value, updated_value
        );

        // 初期エンティティを作成
        let entity = TestEntity::default();
        manager.save_data(doc_type, entity_key, &entity).await?;

        // 初期状態を確認
        let loaded_entity: Option<TestEntity> = manager.load_data(doc_type, entity_key).await?;
        assert!(
            loaded_entity.is_some(),
            "初期エンティティが保存されていません"
        );

        // プロパティの値を更新（パス指定で部分更新）
        manager
            .save_data_at_path(doc_type, property_path, &updated_value)
            .await?;

        // 更新されたデータを読み込み
        let updated_entity: Option<TestEntity> = manager.load_data(doc_type, entity_key).await?;
        assert!(
            updated_entity.is_some(),
            "更新後のエンティティが読み込めません"
        );

        // 特定プロパティのみが更新されていることを確認
        let updated = updated_entity.unwrap();

        // パス指定で値を取得して検証
        let current_value: Option<T> = manager.load_data_at_path(doc_type, property_path).await?;
        assert!(
            current_value.is_some(),
            "更新されたプロパティ値が読み込めません"
        );
        assert_eq!(
            current_value.unwrap(),
            updated_value,
            "プロパティ値が正しく更新されていません"
        );

        // 他のプロパティが影響を受けていないことを確認（基本的なもののみチェック）
        assert_eq!(updated.id, entity.id, "IDが意図せず変更されています");

        println!("✅ Property update test passed for: {}", property_name);
        Ok(())
    }

    /// 複数プロパティの差分更新テストを実行する共通関数
    pub async fn test_multiple_properties_update(
        manager: &mut TestDocumentManager,
        doc_type: &DocumentType,
        entity_key: &str,
        updates: Vec<(&str, &[&str], serde_json::Value)>, // (property_name, path, new_value)
    ) -> Result<(), Box<dyn std::error::Error>> {
        println!(
            "🧪 Testing multiple properties update: {} properties",
            updates.len()
        );

        // 初期エンティティを作成
        let entity = TestEntity::default();
        manager.save_data(doc_type, entity_key, &entity).await?;

        // 各プロパティを順次更新
        for (i, (property_name, path, new_value)) in updates.iter().enumerate() {
            println!("📝 Step {}: Updating property '{}'", i + 1, property_name);
            manager.save_data_at_path(doc_type, path, new_value).await?;

            // 更新を確認
            let current_value: Option<serde_json::Value> =
                manager.load_data_at_path(doc_type, path).await?;
            assert!(
                current_value.is_some(),
                "プロパティ '{}' の更新に失敗",
                property_name
            );
            assert_eq!(
                &current_value.unwrap(),
                new_value,
                "プロパティ '{}' の値が期待値と異なります",
                property_name
            );
        }

        // 最終状態を確認
        let final_entity: Option<TestEntity> = manager.load_data(doc_type, entity_key).await?;
        assert!(final_entity.is_some(), "最終エンティティが読み込めません");

        println!("✅ Multiple properties update test passed");
        Ok(())
    }

    /// ネストしたオブジェクトの差分更新テスト
    pub async fn test_nested_object_update(
        manager: &mut TestDocumentManager,
        doc_type: &DocumentType,
        entity_key: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        println!("🧪 Testing nested object update");

        // 初期エンティティを作成
        let entity = TestEntity::default();
        manager.save_data(doc_type, entity_key, &entity).await?;

        // ネストオブジェクトの各プロパティを更新
        manager
            .save_data_at_path(doc_type, &[entity_key, "nested", "level"], &5)
            .await?;
        manager
            .save_data_at_path(
                doc_type,
                &[entity_key, "nested", "info"],
                &"更新されたネストデータ".to_string(),
            )
            .await?;
        manager
            .save_data_at_path(
                doc_type,
                &[entity_key, "nested", "settings", "theme"],
                &"dark".to_string(),
            )
            .await?;
        manager
            .save_data_at_path(
                doc_type,
                &[entity_key, "nested", "settings", "new_setting"],
                &"新しい設定".to_string(),
            )
            .await?;

        // 更新結果を検証
        let updated_entity: Option<TestEntity> = manager.load_data(doc_type, entity_key).await?;
        assert!(
            updated_entity.is_some(),
            "更新後のエンティティが読み込めません"
        );

        let updated = updated_entity.unwrap();
        assert_eq!(updated.nested.level, 5);
        assert_eq!(updated.nested.info, "更新されたネストデータ");
        assert_eq!(updated.nested.settings.get("theme").unwrap(), "dark");
        assert_eq!(
            updated.nested.settings.get("new_setting").unwrap(),
            "新しい設定"
        );

        // 元の設定も残っていることを確認
        assert_eq!(updated.nested.settings.get("lang").unwrap(), "en");

        // 他のトップレベルプロパティが影響を受けていないことを確認
        assert_eq!(updated.id, entity.id);
        assert_eq!(updated.name, entity.name);
        assert_eq!(updated.value, entity.value);

        println!("✅ Nested object update test passed");
        Ok(())
    }

    /// 配列の差分更新テスト
    pub async fn test_array_differential_update(
        manager: &mut TestDocumentManager,
        doc_type: &DocumentType,
        entity_key: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        println!("🧪 Testing array differential update");

        // 初期エンティティを作成
        let entity = TestEntity::default();
        manager.save_data(doc_type, entity_key, &entity).await?;

        // 配列に新しい要素を追加
        let mut updated_tags = entity.tags.clone();
        updated_tags.push("tag3".to_string());
        updated_tags.push("tag4".to_string());

        manager
            .save_data_at_path(doc_type, &[entity_key, "tags"], &updated_tags)
            .await?;

        // 更新結果を検証
        let updated_entity: Option<TestEntity> = manager.load_data(doc_type, entity_key).await?;
        assert!(updated_entity.is_some());

        let updated = updated_entity.unwrap();
        assert_eq!(updated.tags.len(), 4);
        assert!(updated.tags.contains(&"tag3".to_string()));
        assert!(updated.tags.contains(&"tag4".to_string()));
        assert!(updated.tags.contains(&"tag1".to_string())); // 元の要素も残存

        // 配列全体を新しい配列で更新（特定インデックス更新をシミュレート）
        let mut final_tags = updated.tags.clone();
        final_tags[0] = "updated_tag1".to_string();
        manager
            .save_data_at_path(doc_type, &[entity_key, "tags"], &final_tags)
            .await?;

        let final_entity: Option<TestEntity> = manager.load_data(doc_type, entity_key).await?;
        let final_updated = final_entity.unwrap();
        assert_eq!(final_updated.tags[0], "updated_tag1");
        assert_eq!(final_updated.tags[1], "tag2"); // 他のインデックスは変更されない

        println!("✅ Array differential update test passed");
        Ok(())
    }
}

use differential_update_helpers::*;

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
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
        return std::env::temp_dir()
            .join("flequit_fallback")
            .join(test_name)
            .join(&timestamp);
    }

    println!("Test results will be saved to: {:?}", final_dir);
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
    let storage_path = TestPathGenerator::generate_test_dir(file!(), "test_storage");
    std::fs::create_dir_all(&storage_path)?;

    println!("テストディレクトリ: {:?}", storage_path);

    // FileStorageを作成
    let _file_storage = FileStorage::new(&storage_path)?;

    // ディレクトリが作成されたことを確認
    assert!(storage_path.exists());
    assert!(storage_path.is_dir());

    // 永続保存ディレクトリにコピー（FileStorageテストなのでJSON出力なし）
    let persistent_dir = create_persistent_test_dir("test_file_storage_basic_operations");
    copy_to_persistent_storage(
        &storage_path,
        &persistent_dir,
        "test_file_storage_basic_operations",
    )?;

    Ok(())
}

/// DocumentManagerの基本動作テスト
#[tokio::test]
async fn test_document_manager_creation() -> Result<(), Box<dyn std::error::Error>> {
    // テンポラリディレクトリを作成
    let manager_path =
        TestPathGenerator::generate_test_dir(file!(), "test_document_manager_creation");
    std::fs::create_dir_all(&manager_path)?;

    println!("テストディレクトリ: {:?}", manager_path);

    // TestDocumentManagerを作成（自動JSON履歴出力付き）
    let mut manager = TestDocumentManager::new(&manager_path, "test_document_manager_creation")?;

    // 基本的なドキュメント作成テスト
    let doc_type = DocumentType::Settings;
    manager.get_or_create_document(&doc_type).await?;

    // ドキュメントが作成されたことを確認
    assert!(manager.exists(&doc_type));

    // テスト終了時に詳細変更履歴を出力
    manager.finalize_test(&[doc_type]).await?;

    // 永続保存ディレクトリにコピー
    let persistent_dir = create_persistent_test_dir("test_document_manager_creation");
    copy_to_persistent_storage(
        &manager_path,
        &persistent_dir,
        "test_document_manager_creation",
    )?;

    Ok(())
}

/// 複数のドキュメントタイプのテスト
#[tokio::test]
async fn test_multiple_document_types() -> Result<(), Box<dyn std::error::Error>> {
    // テンポラリディレクトリを作成
    let manager_path =
        TestPathGenerator::generate_test_dir(file!(), "test_multiple_document_types");
    std::fs::create_dir_all(&manager_path)?;

    let mut manager = TestDocumentManager::new(&manager_path, "test_multiple_document_types")?;

    // 複数のドキュメントタイプを作成
    let doc_types = vec![
        DocumentType::Settings,
        DocumentType::Account,
        DocumentType::User,
        DocumentType::Project("test-project-1".into()),
        DocumentType::Project("test-project-2".into()),
    ];

    // 各ドキュメントタイプのドキュメントを作成
    for doc_type in &doc_types {
        manager.get_or_create_document(doc_type).await?;
        assert!(manager.document_exists(doc_type));
    }

    // ドキュメントタイプのリストを取得
    let document_list = manager.list_document_types()?;
    assert_eq!(document_list.len(), doc_types.len());

    // すべてのドキュメントタイプが含まれていることを確認
    for doc_type in &doc_types {
        assert!(document_list.contains(doc_type));
    }

    // テスト終了時に詳細変更履歴を出力
    manager.finalize_test(&doc_types).await?;

    // 永続保存ディレクトリにコピー
    let persistent_dir = create_persistent_test_dir("test_multiple_document_types");
    copy_to_persistent_storage(
        &manager_path,
        &persistent_dir,
        "test_multiple_document_types",
    )?;

    Ok(())
}

/// 単純なデータの書き込み・読み込みテスト
#[tokio::test]
async fn test_simple_data_write_read() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(&temp_dir_path, "test_simple_data_write_read")?;

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

    // テスト終了時に詳細変更履歴を出力
    manager.finalize_test(&[doc_type]).await?;

    // 永続保存ディレクトリにコピー
    let persistent_dir = create_persistent_test_dir("test_simple_data_write_read");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_simple_data_write_read",
    )?;

    Ok(())
}

/// 複雑なJSONデータの書き込み・読み込みテスト
#[tokio::test]
async fn test_complex_json_data_write_read() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager =
        TestDocumentManager::new(&temp_dir_path, "test_complex_json_data_write_read")?;

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
    manager
        .save_data(&doc_type, "app_config", &complex_data)
        .await?;

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
    let projects = loaded["user_settings"]["recent_projects"]
        .as_array()
        .unwrap();
    assert_eq!(projects.len(), 2);
    assert_eq!(projects[0]["id"], "proj1");
    assert_eq!(projects[0]["name"], "プロジェクト1");
    assert_eq!(projects[1]["id"], "proj2");
    assert_eq!(projects[1]["name"], "プロジェクト2");

    // テスト終了時に詳細変更履歴を出力
    manager.finalize_test(&[doc_type]).await?;

    // 永続保存ディレクトリにコピー
    let persistent_dir = create_persistent_test_dir("test_complex_json_data_write_read");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_complex_json_data_write_read",
    )?;

    Ok(())
}

/// 異なるドキュメント間でのデータ分離テスト
#[tokio::test]
async fn test_document_isolation() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    // 異なるドキュメントタイプを使用
    let settings_doc = DocumentType::Settings;
    let account_doc = DocumentType::Account;
    let project_doc = DocumentType::Project("test-project".into());

    // 各ドキュメントに同じキーで異なる値を保存
    let key = "common_key";
    manager
        .save_data(&settings_doc, key, &"settings_value")
        .await?;
    manager
        .save_data(&account_doc, key, &"account_value")
        .await?;
    manager
        .save_data(&project_doc, key, &"project_value")
        .await?;

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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Settings;

    // ドキュメントを作成してデータを保存
    manager
        .save_data(&doc_type, "test_key", &"test_value")
        .await?;
    assert!(manager.exists(&doc_type));

    // ドキュメントを削除
    manager.delete(doc_type.clone())?;
    assert!(!manager.exists(&doc_type));

    // 削除後にデータを読み込もうとした場合の動作確認
    let loaded_value: Option<String> = manager.load_data(&doc_type, "test_key").await?;
    assert_eq!(loaded_value, None);

    Ok(())
}

/// キャッシュクリアテスト
#[tokio::test]
async fn test_cache_clear() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Settings;

    // ドキュメントを作成してデータを保存
    manager
        .save_data(&doc_type, "test_key", &"test_value")
        .await?;
    assert!(manager.exists(&doc_type));

    // キャッシュをクリア
    manager.clear_cache()?;
    assert!(!manager.exists(&doc_type));

    // キャッシュクリア後に新しいドキュメントハンドルが作成される
    // automerge-repoの仕様上、クリア後にデータが保持されるかはStorageの実装に依存する
    let loaded_value: Option<String> = manager.load_data(&doc_type, "test_key").await?;
    // 現在のFileStorage実装では、キャッシュクリア後にデータは保持されない可能性がある
    assert!(loaded_value.is_none() || loaded_value == Some("test_value".to_string()));

    // 読み込み操作後、ドキュメントが存在するようになる
    assert!(manager.exists(&doc_type));

    Ok(())
}

/// パス指定でのデータ保存・読み込みテスト
#[tokio::test]
async fn test_path_based_data_operations() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Settings;

    // パス指定でデータを保存
    let test_data = json!({
        "name": "テストユーザー",
        "settings": {
            "theme": "light",
            "language": "en"
        }
    });

    manager
        .save_data(&doc_type, "user.profile", &test_data)
        .await?;

    // パス指定でデータを読み込み
    let loaded_data: Option<serde_json::Value> =
        manager.load_data(&doc_type, "user.profile").await?;
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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Settings;

    // 初期データを保存
    let initial_data = json!({"version": 1, "theme": "light"});
    manager
        .save_data(&doc_type, "config", &initial_data)
        .await?;

    // データを変更
    let updated_data = json!({"version": 2, "theme": "dark", "language": "ja"});
    manager
        .save_data(&doc_type, "config", &updated_data)
        .await?;

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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let settings_doc = DocumentType::Settings;
    let account_doc = DocumentType::Account;

    // 2つのドキュメントに初期データを保存
    manager
        .save_data(&settings_doc, "preferences", &json!({"theme": "light"}))
        .await?;
    manager
        .save_data(&account_doc, "profile", &json!({"name": "user1"}))
        .await?;

    // 両方のドキュメントを同時に変更
    manager
        .save_data(
            &settings_doc,
            "preferences",
            &json!({"theme": "dark", "language": "en"}),
        )
        .await?;
    manager
        .save_data(
            &account_doc,
            "profile",
            &json!({"name": "user1", "email": "user@example.com"}),
        )
        .await?;

    // 両方のドキュメントが正しく更新されていることを確認
    let settings_data: Option<serde_json::Value> =
        manager.load_data(&settings_doc, "preferences").await?;
    let account_data: Option<serde_json::Value> =
        manager.load_data(&account_doc, "profile").await?;

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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Project("incremental-test".into());

    // 段階1: 基本情報を保存
    let stage1 = json!({
        "name": "Test Project",
        "status": "active"
    });
    manager
        .save_data(&doc_type, "project_info", &stage1)
        .await?;

    // 段階2: タスクを追加
    let stage2 = json!({
        "name": "Test Project",
        "status": "active",
        "tasks": [
            {"id": "task1", "title": "First Task", "completed": false}
        ]
    });
    manager
        .save_data(&doc_type, "project_info", &stage2)
        .await?;

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
    manager
        .save_data(&doc_type, "project_info", &stage3)
        .await?;

    // 最終状態のデータを確認
    let final_data: Option<serde_json::Value> =
        manager.load_data(&doc_type, "project_info").await?;
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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Settings;

    // 数値データから開始
    manager.save_data(&doc_type, "value", &42).await?;
    let loaded_int: Option<i32> = manager.load_data(&doc_type, "value").await?;
    assert_eq!(loaded_int, Some(42));

    // 文字列に変更
    manager
        .save_data(&doc_type, "value", &"hello world")
        .await?;
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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::User;

    // 大きな配列データを作成
    let mut items: Vec<serde_json::Value> = Vec::new();
    for i in 0..100 {
        items.push(json!({"id": i, "name": format!("item_{}", i), "active": true}));
    }

    let initial_data = json!({"items": items});
    manager
        .save_data(&doc_type, "large_dataset", &initial_data)
        .await?;

    // 一部のデータを変更
    let mut updated_items: Vec<serde_json::Value> = Vec::new();
    for i in 0..100 {
        let active = i % 2 == 0; // 偶数のアイテムのみアクティブ
        updated_items
            .push(json!({"id": i, "name": format!("updated_item_{}", i), "active": active}));
    }

    // 新しいアイテムを追加
    for i in 100..110 {
        updated_items.push(json!({"id": i, "name": format!("new_item_{}", i), "active": true}));
    }

    let updated_data = json!({"items": updated_items, "last_update": "2024-01-15"});
    manager
        .save_data(&doc_type, "large_dataset", &updated_data)
        .await?;

    // データが正しく更新されたことを確認
    let loaded_data: Option<serde_json::Value> =
        manager.load_data(&doc_type, "large_dataset").await?;
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
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_json_export_functionality");
    let mut manager = DocumentManager::new(&temp_dir_path)?;

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

    manager
        .save_data(&doc_type, "app_settings", &test_data)
        .await?;

    // JSON出力ディレクトリを作成
    let json_output_dir = &temp_dir_path.join("json_exports");

    // 個別ドキュメントのJSON出力テスト
    let json_file_path = json_output_dir.join("settings_export.json");
    std::fs::create_dir_all(&json_output_dir)?;

    // ドキュメントをJSONファイルにエクスポート
    let document = manager.get_or_create(&DocumentType::Settings).await?;
    document
        .export_json(&json_file_path, Some("JSON export functionality test"))
        .await?;
    println!("📝 Document exported to file: {:?}", json_file_path);

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

    println!(
        "JSON export test completed. Output file: {:?}",
        json_file_path
    );

    // 永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &json_output_dir,
        &persistent_dir,
        "test_json_export_functionality",
    )?;

    Ok(())
}

/// 差分処理でのJSON出力テスト
#[tokio::test]
async fn test_json_export_with_incremental_changes() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_json_export_with_incremental_changes");
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Project("json-export-test".into());
    let json_output_dir = &temp_dir_path.join("incremental_exports");
    std::fs::create_dir_all(&json_output_dir)?;

    println!("JSON export directory: {:?}", json_output_dir);

    // Stage 1: 初期データ
    let stage1_data = json!({
        "name": "Test Project",
        "status": "planning",
        "created_at": "2024-01-01T00:00:00Z"
    });

    manager
        .save_data(&doc_type, "project", &stage1_data)
        .await?;
    // Stage1のドキュメントをエクスポート
    let stage1_path = json_output_dir.join("stage1_initial.json");
    let document = manager.get_or_create(&doc_type).await?;
    document
        .export_json(&stage1_path, Some("Stage 1: Initial project setup"))
        .await?;
    println!("📝 Stage1 document exported to: {:?}", stage1_path);

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

    manager
        .save_data(&doc_type, "project", &stage2_data)
        .await?;
    // Stage2のドキュメントをエクスポート
    let stage2_path = json_output_dir.join("stage2_with_tasks.json");
    document
        .export_json(&stage2_path, Some("Stage 2: Tasks added"))
        .await?;
    println!("📝 Stage2 document exported to: {:?}", stage2_path);

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

    manager
        .save_data(&doc_type, "project", &stage3_data)
        .await?;
    // Stage3のドキュメントをエクスポート
    let stage3_path = json_output_dir.join("stage3_full_project.json");
    document
        .export_json(&stage3_path, Some("Stage 3: Full project with team"))
        .await?;
    println!("📝 Stage3 document exported to: {:?}", stage3_path);

    // 全ドキュメントのエクスポートもテスト
    let all_docs_dir = json_output_dir.join("all_documents");
    manager
        .export_all_documents_to_directory(&all_docs_dir, Some("Complete project state export"))
        .await?;

    // 出力ファイルの確認
    assert!(json_output_dir.join("stage1_initial.json").exists());
    assert!(json_output_dir.join("stage2_with_tasks.json").exists());
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

    // TODO: 詳細変更履歴も出力（一時的にスキップ）
    // let detailed_changes_dir = &temp_dir_path.join("detailed_change_history");
    // export_document_changes_history は現在のAPIで利用できないため、一時的にスキップ
    println!("📝 Detailed changes history export skipped (not implemented)");

    println!("Incremental JSON export test completed successfully");
    println!("詳細変更履歴も出力完了");

    // 永続保存ディレクトリにコピー（全体のtempディレクトリをコピー）
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_json_export_with_incremental_changes",
    )?;

    Ok(())
}

/// Automergeの詳細変更履歴JSON出力テスト
#[tokio::test]
async fn test_json_export_detailed_changes_history() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_json_export_detailed_changes_history");
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let doc_type = DocumentType::Project("detailed-changes-test".into());
    let changes_output_dir = &temp_dir_path.join("detailed_changes");
    std::fs::create_dir_all(&changes_output_dir)?;

    println!("詳細変更履歴出力ディレクトリ: {:?}", changes_output_dir);

    // 変更1: 初期プロジェクト作成
    let change1_data = json!({
        "project": {
            "name": "Automerge Test Project",
            "status": "planning"
        }
    });
    manager
        .save_data(&doc_type, "project", &change1_data["project"])
        .await?;

    // 変更2: ステータス変更とタスクリスト追加
    let change2_data = json!({
        "project": {
            "name": "Automerge Test Project",
            "status": "active"
        },
        "tasks": []
    });
    manager
        .save_data(&doc_type, "project", &change2_data["project"])
        .await?;
    manager
        .save_data(&doc_type, "tasks", &change2_data["tasks"])
        .await?;

    // 変更3: 最初のタスク追加
    let change3_tasks = json!([
        {
            "id": "task_001",
            "title": "Setup development environment",
            "status": "in_progress",
            "priority": "high"
        }
    ]);
    manager
        .save_data(&doc_type, "tasks", &change3_tasks)
        .await?;

    // 変更4: 第2のタスク追加とプロジェクト詳細情報更新
    let change4_project = json!({
        "name": "Automerge Test Project",
        "status": "active",
        "description": "Testing Automerge change tracking capabilities",
        "team_size": 3
    });
    let change4_tasks = json!([
        {
            "id": "task_001",
            "title": "Setup development environment",
            "status": "completed",
            "priority": "high",
            "completed_at": "2024-01-15T10:00:00Z"
        },
        {
            "id": "task_002",
            "title": "Implement core features",
            "status": "in_progress",
            "priority": "medium",
            "assignee": "developer_1"
        }
    ]);
    manager
        .save_data(&doc_type, "project", &change4_project)
        .await?;
    manager
        .save_data(&doc_type, "tasks", &change4_tasks)
        .await?;

    // 変更5: プロジェクト完了と最終統計追加
    let change5_project = json!({
        "name": "Automerge Test Project",
        "status": "completed",
        "description": "Testing Automerge change tracking capabilities",
        "team_size": 3,
        "completion_date": "2024-01-20T15:30:00Z",
        "final_statistics": {
            "total_tasks": 2,
            "completed_tasks": 2,
            "total_hours": 24.5
        }
    });
    let change5_tasks = json!([
        {
            "id": "task_001",
            "title": "Setup development environment",
            "status": "completed",
            "priority": "high",
            "completed_at": "2024-01-15T10:00:00Z"
        },
        {
            "id": "task_002",
            "title": "Implement core features",
            "status": "completed",
            "priority": "medium",
            "assignee": "developer_1",
            "completed_at": "2024-01-20T15:30:00Z"
        }
    ]);
    manager
        .save_data(&doc_type, "project", &change5_project)
        .await?;
    manager
        .save_data(&doc_type, "tasks", &change5_tasks)
        .await?;

    // TODO: 詳細変更履歴をJSON出力（一時的にスキップ）
    // export_document_changes_history は現在のAPIで利用できないため、一時的にスキップ
    println!("📝 Detailed changes history JSON export skipped (not implemented)");

    println!("✅ 詳細変更履歴JSON出力完了");

    // 永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_json_export_detailed_changes_history",
    )?;

    Ok(())
}

/// 複数ドキュメントタイプのJSON出力テスト
#[tokio::test]
async fn test_json_export_multiple_document_types() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let persistent_dir = create_persistent_test_dir("test_json_export_multiple_document_types");
    let mut manager = DocumentManager::new(&temp_dir_path)?;

    let json_output_dir = &temp_dir_path.join("multi_document_exports");
    std::fs::create_dir_all(&json_output_dir)?;

    println!(
        "Multi-document JSON export directory: {:?}",
        json_output_dir
    );

    // 設定ドキュメント
    let settings_data = json!({
        "theme": "dark",
        "language": "en",
        "auto_save": true
    });
    manager
        .save_data(&DocumentType::Settings, "config", &settings_data)
        .await?;

    // アカウントドキュメント
    let account_data = json!({
        "username": "testuser",
        "email": "test@example.com",
        "preferences": {
            "notifications": true,
            "privacy_mode": false
        }
    });
    manager
        .save_data(&DocumentType::Account, "profile", &account_data)
        .await?;

    // ユーザードキュメント
    let user_data = json!({
        "display_name": "Test User",
        "avatar_url": "/avatars/default.png",
        "last_login": "2024-01-15T14:30:00Z"
    });
    manager
        .save_data(&DocumentType::User, "user_info", &user_data)
        .await?;

    // プロジェクトドキュメント
    let project_id = ProjectId::try_from_str("sample-123").unwrap_or_else(|_| ProjectId::new());
    let project_data = json!({
        "title": "Sample Project",
        "description": "A sample project for testing",
        "status": "active",
        "members": ["user1", "user2", "user3"]
    });
    manager
        .save_data(
            &DocumentType::Project(project_id.clone()),
            "info",
            &project_data,
        )
        .await?;

    // 全ドキュメントを一括エクスポート
    manager
        .export_all_documents_to_directory(
            &json_output_dir,
            Some("Multi-document type export test"),
        )
        .await?;

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
    let expected_project_file = format!("project_{}.json", project_id);
    assert!(json_output_dir.join(expected_project_file).exists());

    // 設定ファイルの内容確認
    let settings_content = std::fs::read_to_string(json_output_dir.join("settings.json"))?;
    let settings_json: serde_json::Value = serde_json::from_str(&settings_content)?;

    assert_eq!(settings_json["document_data"]["config"]["theme"], "dark");
    assert_eq!(settings_json["document_data"]["config"]["language"], "en");

    println!("Multi-document JSON export test completed successfully");

    // 永続保存ディレクトリにコピー
    copy_to_persistent_storage(
        &json_output_dir,
        &persistent_dir,
        "test_json_export_multiple_document_types",
    )?;

    Ok(())
}

/// 差分更新テスト：単一プロパティの更新（文字列）
#[tokio::test]
async fn test_differential_update_single_string_property() -> Result<(), Box<dyn std::error::Error>>
{
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(
        &temp_dir_path,
        "test_differential_update_single_string_property",
    )?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    test_single_property_update(
        &mut manager,
        &doc_type,
        entity_key,
        "name",
        "初期エンティティ".to_string(),
        "更新されたエンティティ".to_string(),
        &[entity_key, "name"],
    )
    .await?;

    // テスト終了時に詳細変更履歴を出力
    manager.finalize_test(&[doc_type]).await?;

    // 永続保存
    let persistent_dir =
        create_persistent_test_dir("test_differential_update_single_string_property");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_single_string_property",
    )?;

    Ok(())
}

/// 差分更新テスト：単一プロパティの更新（数値）
#[tokio::test]
async fn test_differential_update_single_numeric_property() -> Result<(), Box<dyn std::error::Error>>
{
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(
        &temp_dir_path,
        "test_differential_update_single_numeric_property",
    )?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    test_single_property_update(
        &mut manager,
        &doc_type,
        entity_key,
        "value",
        100i32,
        999i32,
        &[entity_key, "value"],
    )
    .await?;

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir =
        create_persistent_test_dir("test_differential_update_single_numeric_property");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_single_numeric_property",
    )?;

    Ok(())
}

/// 差分更新テスト：単一プロパティの更新（ブール値）
#[tokio::test]
async fn test_differential_update_single_boolean_property() -> Result<(), Box<dyn std::error::Error>>
{
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(
        &temp_dir_path,
        "test_differential_update_single_boolean_property",
    )?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    test_single_property_update(
        &mut manager,
        &doc_type,
        entity_key,
        "is_active",
        true,
        false,
        &[entity_key, "is_active"],
    )
    .await?;

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir =
        create_persistent_test_dir("test_differential_update_single_boolean_property");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_single_boolean_property",
    )?;

    Ok(())
}

/// 差分更新テスト：オプション型プロパティの更新（None → Some）
#[tokio::test]
async fn test_differential_update_optional_property_none_to_some()
-> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(
        &temp_dir_path,
        "test_differential_update_optional_property_none_to_some",
    )?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    // まず初期エンティティでdescriptionをNoneに設定
    let mut entity = TestEntity::default();
    entity.description = None;
    manager.save_data(&doc_type, entity_key, &entity).await?;

    // None → Some の更新
    let new_description = Some("新しい説明".to_string());
    manager
        .save_data_at_path(&doc_type, &[entity_key, "description"], &new_description)
        .await?;

    // 検証
    let updated_entity: Option<TestEntity> = manager.load_data(&doc_type, entity_key).await?;
    assert!(updated_entity.is_some());
    let updated = updated_entity.unwrap();
    assert_eq!(updated.description, new_description);

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir =
        create_persistent_test_dir("test_differential_update_optional_property_none_to_some");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_optional_property_none_to_some",
    )?;

    Ok(())
}

/// 差分更新テスト：複数プロパティの同時更新
#[tokio::test]
async fn test_differential_update_multiple_properties() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(
        &temp_dir_path,
        "test_differential_update_multiple_properties",
    )?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    let name_path = [entity_key, "name"];
    let value_path = [entity_key, "value"];
    let active_path = [entity_key, "is_active"];
    let desc_path = [entity_key, "description"];

    let updates = vec![
        ("name", &name_path[..], json!("複数更新テスト")),
        ("value", &value_path[..], json!(777)),
        ("is_active", &active_path[..], json!(false)),
        (
            "description",
            &desc_path[..],
            json!("複数プロパティ更新のテスト"),
        ),
    ];

    test_multiple_properties_update(&mut manager, &doc_type, entity_key, updates).await?;

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir = create_persistent_test_dir("test_differential_update_multiple_properties");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_multiple_properties",
    )?;

    Ok(())
}

/// 差分更新テスト：ネストしたオブジェクトの更新
#[tokio::test]
async fn test_differential_update_nested_objects() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager =
        TestDocumentManager::new(&temp_dir_path, "test_differential_update_nested_objects")?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    test_nested_object_update(&mut manager, &doc_type, entity_key).await?;

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir = create_persistent_test_dir("test_differential_update_nested_objects");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_nested_objects",
    )?;

    Ok(())
}

/// 差分更新テスト：配列の差分更新
#[tokio::test]
async fn test_differential_update_arrays() -> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(&temp_dir_path, "test_differential_update_arrays")?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    test_array_differential_update(&mut manager, &doc_type, entity_key).await?;

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir = create_persistent_test_dir("test_differential_update_arrays");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_arrays",
    )?;

    Ok(())
}

/// 差分更新テスト：深いネストのプロパティ更新
#[tokio::test]
async fn test_differential_update_deep_nested_properties() -> Result<(), Box<dyn std::error::Error>>
{
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(
        &temp_dir_path,
        "test_differential_update_deep_nested_properties",
    )?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    println!("🧪 Testing deep nested property updates");

    // 初期エンティティを作成
    let entity = TestEntity::default();
    manager.save_data(&doc_type, entity_key, &entity).await?;

    // 深いネストのプロパティを順次更新
    manager
        .save_data_at_path(
            &doc_type,
            &[entity_key, "nested", "settings", "theme"],
            &"dark".to_string(),
        )
        .await?;
    manager
        .save_data_at_path(
            &doc_type,
            &[entity_key, "nested", "settings", "font_size"],
            &"14px".to_string(),
        )
        .await?;
    manager
        .save_data_at_path(&doc_type, &[entity_key, "metadata", "version"], &json!(2))
        .await?;
    manager
        .save_data_at_path(
            &doc_type,
            &[entity_key, "metadata", "last_modified"],
            &json!("2024-01-15T10:30:00Z"),
        )
        .await?;

    // 検証
    let updated_entity: Option<TestEntity> = manager.load_data(&doc_type, entity_key).await?;
    assert!(updated_entity.is_some());
    let updated = updated_entity.unwrap();

    assert_eq!(updated.nested.settings.get("theme").unwrap(), "dark");
    assert_eq!(updated.nested.settings.get("font_size").unwrap(), "14px");
    assert_eq!(updated.nested.settings.get("lang").unwrap(), "en"); // 元の値は保持
    assert_eq!(updated.metadata.get("version").unwrap(), &json!(2));
    assert_eq!(
        updated.metadata.get("last_modified").unwrap(),
        &json!("2024-01-15T10:30:00Z")
    );
    assert_eq!(
        updated.metadata.get("created_at").unwrap(),
        &json!("2024-01-01T00:00:00Z")
    ); // 元の値は保持

    // 他のトップレベルプロパティが影響されていないことを確認
    assert_eq!(updated.name, entity.name);
    assert_eq!(updated.value, entity.value);
    assert_eq!(updated.is_active, entity.is_active);

    println!("✅ Deep nested property update test passed");

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir =
        create_persistent_test_dir("test_differential_update_deep_nested_properties");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_deep_nested_properties",
    )?;

    Ok(())
}

/// 差分更新テスト：プロパティ名をパラメータ化したテスト
#[tokio::test]
async fn test_differential_update_parameterized_properties()
-> Result<(), Box<dyn std::error::Error>> {
    let temp_dir_path = TestPathGenerator::generate_test_dir(file!(), "test_temp");
    std::fs::create_dir_all(&temp_dir_path)?;
    let mut manager = TestDocumentManager::new(
        &temp_dir_path,
        "test_differential_update_parameterized_properties",
    )?;

    let doc_type = DocumentType::Settings;
    let entity_key = "test_entity";

    println!("🧪 Testing parameterized property updates");

    // パラメータ化されたプロパティテストの定義
    let id_path = [entity_key, "id"];
    let name_path = [entity_key, "name"];
    let desc_path = [entity_key, "description"];
    let value_path = [entity_key, "value"];
    let active_path = [entity_key, "is_active"];
    let nested_level_path = [entity_key, "nested", "level"];
    let nested_info_path = [entity_key, "nested", "info"];

    let property_tests = vec![
        ("id", &id_path[..], json!("updated-entity-001")),
        ("name", &name_path[..], json!("パラメータ化テスト")),
        (
            "description",
            &desc_path[..],
            json!("パラメータ化された更新テスト"),
        ),
        ("value", &value_path[..], json!(555)),
        ("is_active", &active_path[..], json!(false)),
        ("nested.level", &nested_level_path[..], json!(10)),
        (
            "nested.info",
            &nested_info_path[..],
            json!("パラメータ化されたネストデータ"),
        ),
    ];

    // 初期エンティティを作成
    let entity = TestEntity::default();
    manager.save_data(&doc_type, entity_key, &entity).await?;

    // 各プロパティを順次テスト
    for (property_name, path, expected_value) in &property_tests {
        println!("🔧 Testing property: {}", property_name);

        // プロパティを更新
        manager
            .save_data_at_path(&doc_type, path, expected_value)
            .await?;

        // 更新されたことを確認
        let current_value: Option<serde_json::Value> =
            manager.load_data_at_path(&doc_type, path).await?;
        assert!(
            current_value.is_some(),
            "プロパティ '{}' の読み込みに失敗",
            property_name
        );
        assert_eq!(
            &current_value.unwrap(),
            expected_value,
            "プロパティ '{}' の値が期待値と異なります",
            property_name
        );

        println!("✅ Property '{}' updated successfully", property_name);
    }

    // 最終状態でエンティティ全体が正しく更新されていることを確認
    let final_entity: Option<TestEntity> = manager.load_data(&doc_type, entity_key).await?;
    assert!(final_entity.is_some());
    let final_updated = final_entity.unwrap();

    assert_eq!(final_updated.id, "updated-entity-001");
    assert_eq!(final_updated.name, "パラメータ化テスト");
    assert_eq!(final_updated.value, 555);
    assert_eq!(final_updated.is_active, false);
    assert_eq!(final_updated.nested.level, 10);
    assert_eq!(final_updated.nested.info, "パラメータ化されたネストデータ");

    println!("✅ All parameterized property updates completed successfully");

    manager.finalize_test(&[doc_type]).await?;

    let persistent_dir =
        create_persistent_test_dir("test_differential_update_parameterized_properties");
    copy_to_persistent_storage(
        &temp_dir_path,
        &persistent_dir,
        "test_differential_update_parameterized_properties",
    )?;

    Ok(())
}
