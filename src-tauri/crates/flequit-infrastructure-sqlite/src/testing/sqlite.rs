use chrono::Utc;
use serde_json::json;
use std::path::PathBuf;

/// テストフォルダパスを生成するユーティリティ（testing.md準拠）
pub struct TestPathGenerator;

impl TestPathGenerator {
    /// 実行されたテスト関数のファイルパスから、テストルール準拠のパスを生成
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

    /// JSON履歴用のサブディレクトリを作成（必要に応じて）
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
    const TEMPLATE_DB_PATH: &'static str = ".tmp/tests/test_database.db";

    /// テスト用SQLiteデータベースを作成（テンプレートDBをコピー）
    pub fn create_test_database(
        test_file_path: &str,
        test_function_name: &str,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let test_dir = TestPathGenerator::generate_test_dir(test_file_path, test_function_name);
        let current_dir = std::env::current_dir()?;
        let test_dir_full = current_dir.join(&test_dir);
        std::fs::create_dir_all(&test_dir_full)?;

        let test_db_path = test_dir_full.join("test.db");

        // プロジェクトルート基準のテンプレートDBからコピー
        let project_root = current_dir.parent().ok_or("プロジェクトルートが見つかりません ")?;
        let template_path = project_root.join(Self::TEMPLATE_DB_PATH);
        if !template_path.exists() {
            return Err(format!(
                "テンプレートデータベースが見つかりません: {}。build.rsでの作成に失敗している可能性があります。",
                template_path.display()
            )
            .into());
        }

        std::fs::copy(&template_path, &test_db_path).map_err(|e| {
            format!(
                "テンプレートコピー失敗 {} -> {}: {}",
                template_path.display(),
                test_db_path.display(),
                e
            )
        })?;

        println!("📋 SQLiteテストDB作成: {}", test_db_path.display());

        Ok(test_db_path)
    }
}

/// SQLiteテスト用マクロ - テストデータベースを自動作成
#[macro_export]
macro_rules! setup_sqlite_test {
    ($test_function_name:expr) => {
        $crate::testing::sqlite::SqliteTestHarness::create_test_database(
            file!(),
            $test_function_name,
        )
    };
}
