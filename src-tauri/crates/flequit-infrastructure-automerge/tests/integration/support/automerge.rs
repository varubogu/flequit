use std::path::PathBuf;
use flequit_testing::TestPathGenerator;

pub struct AutomergeTestHarness;

impl AutomergeTestHarness {
    const TEMPLATE_DB_PATH: &'static str = "test_database.db";

    pub fn copy_database_template(
        template_dir: &PathBuf,
        output_dir_path: &PathBuf,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let output_file_path = output_dir_path.join("test_database.db");
        let template_file = template_dir.join(Self::TEMPLATE_DB_PATH);
        std::fs::create_dir_all(&output_dir_path)?;
        std::fs::copy(template_file, &output_file_path)?;
        Ok(output_file_path)
    }

    pub fn create_test_database(
        test_file_path: &str,
        test_function_name: &str,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let test_dir = TestPathGenerator::generate_test_dir(test_file_path, test_function_name);
        
        // プロジェクトルートを FLEQUIT_PROJECT_ROOT 環境変数から取得（フォールバック付き）
        let project_root = std::env::var("FLEQUIT_PROJECT_ROOT")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|_| {
                // フォールバック: 現在のディレクトリから推定
                let current_dir = std::env::current_dir().expect("現在のディレクトリが取得できません");
                current_dir
                    .parent()  // crates
                    .and_then(|p| p.parent())  // src-tauri
                    .and_then(|p| p.parent())  // プロジェクトルート
                    .expect("プロジェクトルートが見つかりません")
                    .to_path_buf()
            });

        let test_dir_full = project_root.join(&test_dir);
        std::fs::create_dir_all(&test_dir_full)?;

        let test_db_path = test_dir_full.join("test.db");
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
        $crate::integration::support::automerge::AutomergeTestHarness::create_test_database(
            file!(),
            $test_function_name,
        )
    };
}
