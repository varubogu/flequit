use async_trait::async_trait;
use chrono::Utc;
use serde_json::json;
use std::{path::PathBuf, sync::{Arc, Mutex}};

/// テストフォルダパスを生成するユーティリティ
pub struct TestPathGenerator;

impl TestPathGenerator {
    /// テストルール準拠のパスを生成
    pub fn generate_test_dir(file_path: &str, test_function_name: &str) -> PathBuf {
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();

        let path = std::path::Path::new(file_path);
        let relative_test_path = if let Some(tests_pos) = file_path.find("tests/") {
            let after_tests = &file_path[tests_pos + 6..];
            std::path::Path::new(after_tests)
        } else {
            path
        };
        let path_without_extension = relative_test_path.with_extension("");

        PathBuf::from("../../../.tmp/tests/cargo")
            .join(path_without_extension)
            .join(test_function_name)
            .join(timestamp)
    }

    /// automergeデータ用のサブディレクトリを作成
    pub fn create_automerge_dir(
        base_test_dir: &std::path::Path,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let automerge_dir = base_test_dir.join("automerge");
        std::fs::create_dir_all(&automerge_dir)?;
        Ok(automerge_dir)
    }

    /// JSON履歴用のサブディレクトリを作成
    pub fn create_json_history_dir(
        base_test_dir: &std::path::Path,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let json_dir = base_test_dir.join("json_history");
        std::fs::create_dir_all(&json_dir)?;
        Ok(json_dir)
    }
}

/// automergeドキュメント履歴を管理するトレイト
#[async_trait]
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
                println!(
                    "⚠️  Failed to export automerge JSON for step {}: {}",
                    step, e
                );
            }
        }

        Ok(())
    }

    /// 現在のステップ数を取得
    pub fn current_step(&self) -> usize {
        *self.step_counter.lock().unwrap()
    }
}
