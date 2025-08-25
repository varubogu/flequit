//! 統合テスト用ユーティリティ
//!
//! テストフォルダパス取得、automerge履歴保存など、
//! 統合テスト間で共通利用する機能を提供します。

use chrono::Utc;
use serde_json::json;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// テストフォルダパスを生成するユーティリティ
pub struct TestPathGenerator;

impl TestPathGenerator {
    /// 実行されたテスト関数のファイルパスから、テストルール準拠のパスを生成
    /// 
    /// # Arguments
    /// * `file_path` - テストファイルの__FILE__パス（例: "tests/integration/project_document_test.rs"）
    /// * `test_function_name` - テスト関数名
    /// 
    /// # Returns
    /// `<project_root>/.tmp/tests/cargo/integration/[テストファイル名]/[テスト関数名]/[実行日時]/`
    pub fn generate_test_dir(file_path: &str, test_function_name: &str) -> PathBuf {
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        
        // ファイルパスからテストファイル名を抽出
        let test_file_name = std::path::Path::new(file_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown_test");
        
        // テストルール準拠のパス生成: <project_root>/.tmp/tests/cargo/integration/[テストファイル名]/[テスト関数名]/[実行日時]/
        PathBuf::from("../.tmp/tests/cargo/integration")
            .join(test_file_name)
            .join(test_function_name)
            .join(timestamp)
    }
    
    /// automergeデータ用のサブディレクトリを作成
    pub fn create_automerge_dir(base_test_dir: &std::path::Path) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let automerge_dir = base_test_dir.join("automerge");
        std::fs::create_dir_all(&automerge_dir)?;
        Ok(automerge_dir)
    }
    
    /// JSON履歴用のサブディレクトリを作成
    pub fn create_json_history_dir(base_test_dir: &std::path::Path) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let json_dir = base_test_dir.join("json_history");
        std::fs::create_dir_all(&json_dir)?;
        Ok(json_dir)
    }
}

/// automergeドキュメント履歴を管理するトレイト
/// 
/// automergeを利用するテストで、１つ編集するごとにJSONスナップショットを出力する
pub trait AutomergeHistoryExporter {
    /// 現在のautomergeドキュメント状態をJSONとしてエクスポート
    async fn export_document_as_json(&self) -> Result<serde_json::Value, Box<dyn std::error::Error>>;
}

/// automergeドキュメント履歴管理ヘルパー
pub struct AutomergeHistoryManager {
    step_counter: Arc<Mutex<usize>>,
    json_history_dir: PathBuf,
    test_name: String,
}

impl AutomergeHistoryManager {
    /// 新しいautomerge履歴管理を作成
    pub fn new(json_history_dir: PathBuf, test_name: &str) -> Self {
        Self {
            step_counter: Arc::new(Mutex::new(0)),
            json_history_dir,
            test_name: test_name.to_string(),
        }
    }
    
    /// automerge操作後の履歴をJSONファイルに保存
    /// 
    /// # Arguments
    /// * `exporter` - AutomergeHistoryExporterを実装したオブジェクト
    /// * `action` - 実行されたアクション名（例: "add_task", "update_subtask"）
    /// * `entity_type` - エンティティタイプ（例: "project", "task", "subtask"）
    pub async fn export_history<T: AutomergeHistoryExporter>(
        &mut self,
        exporter: &T,
        action: &str,
        entity_type: &str,
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
            entity_type,
            action.replace("/", "_").replace(" ", "_")
        );

        let export_path = self.json_history_dir.join(&filename);

        // 現在のドキュメントデータを出力
        let doc_data = exporter.export_document_as_json().await;

        match doc_data {
            Ok(json_data) => {
                let metadata = json!({
                    "step": step,
                    "test_name": self.test_name,
                    "entity_type": entity_type,
                    "action": action,
                    "timestamp": Utc::now().to_rfc3339(),
                    "filename": filename
                });

                let output_data = json!({
                    "metadata": metadata,
                    "document_data": json_data
                });

                std::fs::write(&export_path, serde_json::to_string_pretty(&output_data)?)?;
                println!("📄 Step {}: Exported automerge history to: {}", step, filename);
            }
            Err(e) => {
                println!("⚠️  Failed to export automerge JSON for step {}: {}", step, e);
            }
        }

        Ok(())
    }
    
    /// 現在のステップ数を取得
    pub fn current_step(&self) -> usize {
        *self.step_counter.lock().unwrap()
    }
}

/// テストクリーンアップヘルパー
pub struct TestCleanupHelper;

impl TestCleanupHelper {
    /// テスト終了時のディレクトリクリーンアップ
    pub fn cleanup_test_directory(test_dir: &std::path::Path) {
        if test_dir.exists() {
            println!("🗑️ Cleaning up test directory: {:?}", test_dir);
            if let Err(e) = std::fs::remove_dir_all(test_dir) {
                println!("⚠️ Warning: Failed to clean up test directory: {}", e);
            }
        }
    }
}

/// テスト用マクロ - テストディレクトリパスを自動生成
#[macro_export]
macro_rules! generate_test_path {
    ($test_function_name:expr) => {
        $crate::test_utils::TestPathGenerator::generate_test_dir(file!(), $test_function_name)
    };
}

/// テスト用マクロ - テスト終了時のクリーンアップ
#[macro_export]
macro_rules! cleanup_test {
    ($test_dir:expr) => {
        $crate::test_utils::TestCleanupHelper::cleanup_test_directory($test_dir)
    };
}