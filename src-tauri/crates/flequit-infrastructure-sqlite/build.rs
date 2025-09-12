fn main() {
    create_test_template_database();
}

/// testing.mdルール準拠: テストビルド時に1度だけマイグレーションを実行
fn create_test_template_database() {
    println!("cargo:warning=🔧 SQLiteテストテンプレートデータベース作成開始 (infra-sqlite)");

    if std::env::var("FLEQUIT_BUILD_RS_RUNNING").is_ok() {
        println!("cargo:warning=⚠️ build.rs再帰実行検知、cargoコマンド実行をスキップ");
        return;
    }

    // FLEQUIT_PROJECT_ROOT環境変数を使用（フォールバック付き）
    let project_root = std::env::var("FLEQUIT_PROJECT_ROOT")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            println!("cargo:warning=⚠️ FLEQUIT_PROJECT_ROOT未設定、フォールバックロジック使用");
            // フォールバック: 従来のロジック
            let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
                .map(std::path::PathBuf::from)
                .expect("CARGO_MANIFEST_DIRが設定されていません");

            manifest_dir
                .parent() // crates
                .and_then(|p| p.parent()) // src-tauri
                .and_then(|p| p.parent()) // プロジェクトルート
                .expect("プロジェクトルートが見つかりません")
                .to_path_buf()
        });

    println!(
        "cargo:warning=🏠 プロジェクトルート: {}",
        project_root.display()
    );
    let template_path = project_root.join(".tmp/tests/test_database.db");

    if let Some(parent) = template_path.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            println!("cargo:warning=❌ テストDBディレクトリ作成失敗: {}", e);
            return;
        }
    }

    println!(
        "cargo:warning=📍 テンプレートパス: {}",
        template_path.display()
    );

    if template_path.exists() {
        println!("cargo:warning=🗑️ 既存テンプレートDB削除中...");
        if let Err(e) = std::fs::remove_file(&template_path) {
            println!("cargo:warning=❌ 既存テンプレートDB削除失敗: {}", e);
            return;
        }
    }

    println!("cargo:warning=🚀 migration_runner実行開始...");

    let output = std::process::Command::new("cargo")
        .args(&[
            "run",
            "--bin",
            "migration_runner",
            template_path.to_string_lossy().as_ref(),
        ])
        .env("CARGO_TARGET_DIR", "target/migration")
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
            println!(
                "cargo:warning=📁 ファイル存在確認: {}",
                template_path.exists()
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
            println!(
                "cargo:warning=❌ マイグレーション失敗: {}",
                String::from_utf8_lossy(&result.stderr)
            );
        }
        Err(e) => {
            println!("cargo:warning=❌ マイグレーションコマンド実行失敗: {}", e);
        }
    }
}
