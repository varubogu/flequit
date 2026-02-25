use flequit_testing::TestPathGenerator;
use std::path::PathBuf;
use std::sync::OnceLock;

static TEMPLATE_DB_PREPARE_RESULT: OnceLock<Result<(), String>> = OnceLock::new();

pub struct SqliteTestHarness;

impl SqliteTestHarness {
    const TEMPLATE_DB_PATH: &'static str = "test_database.db";

    pub fn copy_database_template(
        template_dir: &PathBuf,
        output_dir_path: &PathBuf,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let output_file_path = output_dir_path.join("test_database.db");
        let template_file = template_dir.join(Self::TEMPLATE_DB_PATH);
        Self::ensure_template_database(&template_file)?;
        std::fs::create_dir_all(&output_dir_path)?;
        std::fs::copy(template_file, &output_file_path)?;
        Ok(output_file_path)
    }

    pub fn create_test_database(
        test_file_path: &str,
        test_function_name: &str,
    ) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let test_dir = TestPathGenerator::generate_test_dir(test_file_path, test_function_name);
        let current_dir = std::env::current_dir()?;
        let test_dir_full = current_dir.join(&test_dir);
        std::fs::create_dir_all(&test_dir_full)?;

        let test_db_path = test_dir_full.join("test.db");

        let template_dir = current_dir.join(TestPathGenerator::generate_test_crate_dir(
            "flequit-infrastructure-sqlite",
        ));
        let template_path = template_dir.join(Self::TEMPLATE_DB_PATH);
        Self::ensure_template_database(&template_path)?;

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

    fn ensure_template_database(template_file: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        let template_file = template_file.clone();
        let result = TEMPLATE_DB_PREPARE_RESULT.get_or_init(move || {
            if let Some(parent) = template_file.parent() {
                if let Err(e) = std::fs::create_dir_all(parent) {
                    return Err(format!(
                        "テンプレートDBディレクトリ作成に失敗: {} ({})",
                        parent.display(),
                        e
                    ));
                }
            }

            let output = if let Ok(bin_path) = std::env::var("CARGO_BIN_EXE_migration_runner") {
                std::process::Command::new(bin_path)
                    .arg(template_file.to_string_lossy().to_string())
                    .arg("--force")
                    .output()
            } else {
                // フォールバック: テスト実行ディレクトリ(src-tauri)からcargo経由で実行
                std::process::Command::new("cargo")
                    .args([
                        "run",
                        "-j",
                        "4",
                        "-p",
                        "flequit-infrastructure-sqlite",
                        "--bin",
                        "migration_runner",
                        "--",
                        template_file.to_string_lossy().as_ref(),
                        "--force",
                    ])
                    .output()
            };

            match output {
                Ok(output) if output.status.success() => Ok(()),
                Ok(output) => Err(format!(
                    "テンプレートDB更新に失敗 (status: {})\nstdout:\n{}\nstderr:\n{}",
                    output.status,
                    String::from_utf8_lossy(&output.stdout),
                    String::from_utf8_lossy(&output.stderr)
                )),
                Err(e) => Err(format!("テンプレートDB更新コマンド実行失敗: {}", e)),
            }
        });

        match result {
            Ok(()) => Ok(()),
            Err(e) => Err(std::io::Error::other(e.clone()).into()),
        }
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
