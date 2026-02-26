use chrono::Utc;
use std::path::PathBuf;

/// テストフォルダパスを生成するユーティリティ
pub struct TestPathGenerator;

impl TestPathGenerator {
    pub fn generate_test_base_dir() -> PathBuf {
        PathBuf::from("../../../.tmp/tests/cargo")
    }

    pub fn generate_test_crate_dir(crate_name: &str) -> PathBuf {
        Self::generate_test_base_dir().join(crate_name)
    }

    pub fn generate_test_file_path_dir(crate_name: &str, file_path: &str) -> PathBuf {
        Self::generate_test_crate_dir(crate_name).join(file_path)
    }

    pub fn generate_test_case_path_dir(
        crate_name: &str,
        file_path: &str,
        test_function_name: &str,
    ) -> PathBuf {
        Self::generate_test_file_path_dir(crate_name, file_path).join(test_function_name)
    }

    /// 実行されたテスト関数のファイルパスから、テストルール準拠のパスを生成
    /// `<project_root>/.tmp/tests/cargo/[クレート名]/[テストファイルの相対パス]/[テスト関数名]/[実行日時]/`
    pub fn generate_test_dir(file_path: &str, test_function_name: &str) -> PathBuf {
        // 並列実行時のディレクトリ衝突を避けるため、マイクロ秒まで含める
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S_%6f").to_string();

        // クレート名を抽出
        let crate_name = Self::extract_crate_name(file_path);

        // テストファイルの相対パスを抽出
        let test_relative_path = Self::extract_test_relative_path(file_path);

        let crate_name_str = crate_name.as_str();
        let test_file_str = &test_relative_path.to_string_lossy();
        let test_func_str = test_function_name;

        Self::generate_test_case_path_dir(crate_name_str, test_file_str, test_func_str)
            .join(timestamp)
    }

    /// ファイルパスからクレート名を抽出
    /// 例: "src-tauri/crates/flequit-settings/tests/integration_tests.rs" -> "flequit-settings"
    fn extract_crate_name(file_path: &str) -> String {
        let path = std::path::Path::new(file_path);

        // "crates/" を含むパスからクレート名を抽出
        if let Some(crates_pos) = file_path.find("crates/") {
            let after_crates = &file_path[crates_pos + 7..]; // "crates/".len() = 7
            if let Some(next_slash_pos) = after_crates.find('/') {
                return after_crates[..next_slash_pos].to_string();
            }
        }

        // フォールバック: パスの親ディレクトリ名から推測
        path.parent()
            .and_then(|parent| parent.file_name())
            .and_then(|name| name.to_str())
            .unwrap_or("unknown-crate")
            .to_string()
    }

    /// ファイルパスからテストファイルの相対パスを抽出
    /// 例: "src-tauri/crates/flequit-settings/tests/integration_tests.rs" -> "tests/integration_tests"
    fn extract_test_relative_path(file_path: &str) -> PathBuf {
        let path = std::path::Path::new(file_path);

        // "tests/" を含む部分以降を抽出
        if let Some(tests_pos) = file_path.find("tests/") {
            let from_tests = &file_path[tests_pos..];
            let path_from_tests = std::path::Path::new(from_tests);

            // 拡張子を除去
            return path_from_tests.with_extension("");
        }

        // フォールバック: ファイル名のみ（拡張子なし）
        path.with_extension("")
            .file_name()
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("unknown-test"))
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
