//! 統合テスト用ユーティリティ
//!
//! テストフォルダパス取得、automerge履歴保存など、
//! 統合テスト間で共通利用する機能を提供します。

use chrono::Utc;
use serde_json::json;
use std::{path::PathBuf, sync::{Arc, Mutex}};

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
    /// `<project_root>/.tmp/tests/cargo/[テスト階層]/[テスト関数名]/[実行日時]/`
    pub fn generate_test_dir(file_path: &str, test_function_name: &str) -> PathBuf {
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();

        // ファイルパスから相対パス情報を抽出（testsディレクトリ以下）
        let path = std::path::Path::new(file_path);
        
        // "tests/" 以降のパス部分を取得
        let relative_test_path = if let Some(tests_pos) = file_path.find("tests/") {
            let after_tests = &file_path[tests_pos + 6..]; // "tests/" の6文字をスキップ
            std::path::Path::new(after_tests)
        } else {
            // "tests/" が見つからない場合はファイル名のみ使用
            path
        };

        // 拡張子を除いたパス構造を取得
        let path_without_extension = relative_test_path.with_extension("");
        
        // テストルール準拠のパス生成: <project_root>/.tmp/tests/cargo/[テスト階層]/[テスト関数名]/[実行日時]/
        PathBuf::from("../.tmp/tests/cargo")
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

/// SQLiteテストハーネス - testing.mdルール準拠（build.rs版）
pub struct SqliteTestHarness;

impl SqliteTestHarness {
    /// テンプレートデータベースのパス
    const TEMPLATE_DB_PATH: &'static str = ".tmp/tests/test_database.db";

    /// テスト用SQLiteデータベースを作成（テンプレートDBをコピー）
    pub fn create_test_database(
        test_file_path: &str,
        test_function_name: &str
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        // テスト用データベースパスを生成（testing.mdルール準拠）
        let test_dir = TestPathGenerator::generate_test_dir(test_file_path, test_function_name);
        let current_dir = std::env::current_dir()?;
        let test_dir_full = current_dir.join(&test_dir);
        std::fs::create_dir_all(&test_dir_full)?;

        let test_db_path = test_dir_full.join("test.db");

        // build.rsで作成されたテンプレートからコピー（プロジェクトルート基準）
        let project_root = current_dir.parent().ok_or("プロジェクトルートが見つかりません ")?;
        let template_path = project_root.join(Self::TEMPLATE_DB_PATH);
        if !template_path.exists() {
            return Err(format!(
                "テンプレートデータベースが見つかりません: {}。build.rsでの作成に失敗している可能性があります。",
                template_path.display()
            ).into());
        }

        std::fs::copy(&template_path, &test_db_path)
            .map_err(|e| format!("テンプレートコピー失敗 {} -> {}: {}",
                                template_path.display(), test_db_path.display(), e))?;

        println!("📋 SQLiteテストDB作成: {}", test_db_path.display());

        Ok(test_db_path)
    }
}



/// SQLiteテスト用マクロ - テストデータベースを自動作成
#[macro_export]
macro_rules! setup_sqlite_test {
    ($test_function_name:expr) => {
        $crate::test_utils::SqliteTestHarness::create_test_database(
            file!(),
            $test_function_name
        )
    };
}

/// automergeドキュメント履歴を管理するトレイト
///
/// automergeを利用するテストで、１つ編集するごとにJSONスナップショットを出力する
pub trait AutomergeHistoryExporter {
    /// 現在のautomergeドキュメント状態をJSONとしてエクスポート
    async fn export_document_as_json(
        &self,
    ) -> Result<serde_json::Value, Box<dyn std::error::Error>>;
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
                println!(
                    "📄 Step {}: Exported automerge history to: {}",
                    step, filename
                );
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
