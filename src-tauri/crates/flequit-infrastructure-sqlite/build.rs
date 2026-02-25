use std::path::PathBuf;

const ENABLE_SETUP_ENV: &str = "FLEQUIT_BUILD_RS_ENABLE_TEST_SETUP";

fn main() {
    println!("cargo:rerun-if-env-changed={ENABLE_SETUP_ENV}");

    if !is_build_rs_setup_enabled() {
        println!(
            "cargo:warning=ℹ️ build.rsテストセットアップをスキップ（{} が未設定）",
            ENABLE_SETUP_ENV
        );
        return;
    }

    create_test_template_database();
}

fn is_build_rs_setup_enabled() -> bool {
    matches!(
        std::env::var(ENABLE_SETUP_ENV).ok().as_deref(),
        Some("1") | Some("true") | Some("TRUE")
    )
}

fn resolve_project_root() -> PathBuf {
    if let Some(root) = std::env::var("FLEQUIT_PROJECT_ROOT")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
    {
        return PathBuf::from(root);
    }

    println!("cargo:warning=⚠️ FLEQUIT_PROJECT_ROOT未設定、フォールバックロジック使用");
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
        .map(PathBuf::from)
        .expect("CARGO_MANIFEST_DIRが設定されていません");

    manifest_dir
        .parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .expect("プロジェクトルートが見つかりません")
        .to_path_buf()
}

/// 開発中の自動再ビルドループを避けるため、明示的に有効化されたときのみ実行する。
fn create_test_template_database() {
    println!("cargo:warning=🔧 SQLiteテストテンプレートデータベース作成開始 (infra-sqlite)");

    if std::env::var("FLEQUIT_BUILD_RS_RUNNING").is_ok() {
        println!("cargo:warning=⚠️ build.rs再帰実行検知、cargoコマンド実行をスキップ");
        return;
    }

    let project_root = resolve_project_root();
    println!(
        "cargo:warning=🏠 プロジェクトルート: {}",
        project_root.display()
    );

    let template_path = project_root.join(".tmp/tests/cargo/flequit-infrastructure-sqlite/test_database.db");
    println!(
        "cargo:warning=📍 テンプレートパス: {}",
        template_path.display()
    );

    if template_path.exists() {
        println!(
            "cargo:warning=ℹ️ 既存テンプレートDBを再利用: {}",
            template_path.display()
        );
        return;
    }

    if let Some(parent) = template_path.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            println!("cargo:warning=❌ テストDBディレクトリ作成失敗: {}", e);
            return;
        }
    }

    let manifest_path = std::env::var("CARGO_MANIFEST_DIR")
        .map(PathBuf::from)
        .expect("CARGO_MANIFEST_DIRが設定されていません")
        .join("Cargo.toml");
    let manifest_path_str = manifest_path.to_string_lossy().to_string();
    let template_path_str = template_path.to_string_lossy().to_string();

    println!("cargo:warning=🚀 migration_runner実行開始...");

    let output = std::process::Command::new("cargo")
        .args([
            "run",
            "--manifest-path",
            manifest_path_str.as_str(),
            "--bin",
            "migration_runner",
            "--",
            template_path_str.as_str(),
        ])
        .env("FLEQUIT_BUILD_RS_RUNNING", "1")
        .output();

    match output {
        Ok(result) if result.status.success() => {
            println!(
                "cargo:warning=📤 migration_runner stdout: {}",
                String::from_utf8_lossy(&result.stdout)
            );
            println!(
                "cargo:warning=✅ SQLiteテストテンプレートDB作成完了: {}",
                template_path.display()
            );
        }
        Ok(result) => {
            println!(
                "cargo:warning=📤 migration_runner stdout: {}",
                String::from_utf8_lossy(&result.stdout)
            );
            println!(
                "cargo:warning=📥 migration_runner stderr: {}",
                String::from_utf8_lossy(&result.stderr)
            );
            println!("cargo:warning=📊 exit code: {}", result.status);
        }
        Err(e) => {
            println!("cargo:warning=❌ マイグレーションコマンド実行失敗: {}", e);
        }
    }
}
