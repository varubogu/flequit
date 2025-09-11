use std::path::PathBuf;
use flequit_testing::TestPathGenerator;

pub struct SqliteTestHarness;

impl SqliteTestHarness {
    const TEMPLATE_DB_PATH: &'static str = ".tmp/tests/test_database.db";

    pub fn create_test_database(
        test_file_path: &str,
        test_function_name: &str,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let test_dir = TestPathGenerator::generate_test_dir(test_file_path, test_function_name);
        let current_dir = std::env::current_dir()?;
        let test_dir_full = current_dir.join(&test_dir);
        std::fs::create_dir_all(&test_dir_full)?;

        let test_db_path = test_dir_full.join("test.db");

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

#[macro_export]
macro_rules! setup_sqlite_test {
    ($test_function_name:expr) => {
        $crate::integration::support::sqlite::SqliteTestHarness::create_test_database(
            file!(),
            $test_function_name,
        )
    };
}
