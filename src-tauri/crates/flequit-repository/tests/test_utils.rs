//! 統合テスト用ユーティリティ
//!
//! テストフォルダパス取得、automerge履歴保存など、
//! 統合テスト間で共通利用する機能を提供します。

use async_trait::async_trait;
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
