use chrono::Utc;
use std::path::PathBuf;

/// テストフォルダパスを生成するユーティリティ
pub struct TestPathGenerator;

impl TestPathGenerator {
    /// 実行されたテスト関数のファイルパスから、テストルール準拠のパスを生成
    /// `<project_root>/.tmp/tests/cargo/[テスト階層]/[テスト関数名]/[実行日時]/`
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

    /// JSON履歴用のサブディレクトリを作成
    pub fn create_json_history_dir(
        base_test_dir: &std::path::Path,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let json_dir = base_test_dir.join("json_history");
        std::fs::create_dir_all(&json_dir)?;
        Ok(json_dir)
    }

    /// automergeデータ用のサブディレクトリを作成
    pub fn create_automerge_dir(
        base_test_dir: &std::path::Path,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let automerge_dir = base_test_dir.join("automerge");
        std::fs::create_dir_all(&automerge_dir)?;
        Ok(automerge_dir)
    }
}
