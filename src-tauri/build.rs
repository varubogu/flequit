use std::path::Path;

fn main() {
    // テストビルド時にテンプレートデータベースを作成
    if std::env::var("PROFILE").unwrap_or_default() == "test" || 
       std::env::args().any(|arg| arg.contains("test")) {
        create_test_template_database();
    }
    
    tauri_build::build()
}

/// testing.mdルール準拠: テストビルド時に1度だけマイグレーションを実行
fn create_test_template_database() {
    println!("cargo:warning=🔧 SQLiteテストテンプレートデータベース作成開始");
    
    let template_path = Path::new(".tmp/tests/test_database.db");
    
    // ディレクトリ作成
    if let Some(parent) = template_path.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            println!("cargo:warning=❌ テストDBディレクトリ作成失敗: {}", e);
            return;
        }
    }
    
    // 既存ファイル削除
    if template_path.exists() {
        if let Err(e) = std::fs::remove_file(template_path) {
            println!("cargo:warning=❌ 既存テンプレートDB削除失敗: {}", e);
            return;
        }
    }
    
    // Rustのサブプロセスでマイグレーション実行
    let output = std::process::Command::new("cargo")
        .args(&[
            "run",
            "--bin", "migration_runner",
            template_path.to_string_lossy().as_ref()
        ])
        .env("CARGO_TARGET_DIR", "target/migration")
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
