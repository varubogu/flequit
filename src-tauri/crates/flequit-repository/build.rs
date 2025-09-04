
fn main() {
    // テストビルド時にテンプレートデータベースを作成
    let profile = std::env::var("PROFILE").unwrap_or_default();
    let target_env = std::env::var("CARGO_CFG_TEST").is_ok();
    let is_test_build = profile == "test" || 
                        target_env ||
                        std::env::args().any(|arg| arg.contains("test")) ||
                        std::env::var("CARGO_PRIMARY_PACKAGE").is_ok(); // テスト実行時に設定される
    
    println!("cargo:warning=🔍 build.rs実行: PROFILE={}, target_env={}, is_test_build={}", profile, target_env, is_test_build);
    
    // テンプレートデータベースの作成は常に実行（テストに必要）
    create_test_template_database();
    
    // tauri_build is not needed for storage crate
}

/// testing.mdルール準拠: テストビルド時に1度だけマイグレーションを実行
fn create_test_template_database() {
    println!("cargo:warning=🔧 SQLiteテストテンプレートデータベース作成開始");
    
    // 再帰実行を防ぐため、環境変数をチェック
    if std::env::var("FLEQUIT_BUILD_RS_RUNNING").is_ok() {
        println!("cargo:warning=⚠️ build.rs再帰実行検知、cargoコマンド実行をスキップ");
        return;
    }
    
    // プロジェクトルート基準でパスを作成
    let current_dir = std::env::current_dir().expect("カレントディレクトリが取得できません");
    let project_root = current_dir.parent().expect("プロジェクトルートが見つかりません");
    let template_path = project_root.join(".tmp/tests/test_database.db");
    
    // ディレクトリ作成
    if let Some(parent) = template_path.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            println!("cargo:warning=❌ テストDBディレクトリ作成失敗: {}", e);
            return;
        }
    }
    
    // 既存ファイル削除
    if template_path.exists() {
        if let Err(e) = std::fs::remove_file(&template_path) {
            println!("cargo:warning=❌ 既存テンプレートDB削除失敗: {}", e);
            return;
        }
    }
    
    // Rustのサブプロセスでマイグレーション実行（再帰防止環境変数を設定）
    let output = std::process::Command::new("cargo")
        .args(&[
            "run",
            "--bin", "migration_runner",
            template_path.to_string_lossy().as_ref()
        ])
        .env("CARGO_TARGET_DIR", "target/migration")
        .env("FLEQUIT_BUILD_RS_RUNNING", "1")  // 再帰実行防止
        .output();
    
    match output {
        Ok(result) if result.status.success() => {
            println!("cargo:warning=✅ SQLiteテストテンプレートDB作成完了: {}", template_path.display());
        }
        Ok(result) => {
            println!("cargo:warning=❌ マイグレーション失敗: {}", String::from_utf8_lossy(&result.stderr));
        }
        Err(e) => {
            println!("cargo:warning=❌ マイグレーションコマンド実行失敗: {}", e);
        }
    }
}
