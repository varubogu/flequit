fn main() {
    create_test_output_directories();
}

/// testing.mdルール準拠: テストビルド時に出力ディレクトリを作成
fn create_test_output_directories() {
    println!("cargo:warning=🔧 Automergeテスト出力ディレクトリ作成開始 (infra-automerge)");

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
    let output_dir = project_root.join(".tmp/tests/cargo/flequit-infrastructure-automerge");

    if let Err(e) = std::fs::create_dir_all(&output_dir) {
        println!("cargo:warning=❌ テスト出力ディレクトリ作成失敗: {}", e);
        return;
    }

    println!(
        "cargo:warning=📁 テスト出力ディレクトリ作成完了: {}",
        output_dir.display()
    );

    // サブディレクトリも作成
    let automerge_dir = output_dir.join("automerge");
    let json_dir = output_dir.join("json");

    if let Err(e) = std::fs::create_dir_all(&automerge_dir) {
        println!("cargo:warning=❌ automergeサブディレクトリ作成失敗: {}", e);
    } else {
        println!(
            "cargo:warning=📁 automergeディレクトリ作成完了: {}",
            automerge_dir.display()
        );
    }

    if let Err(e) = std::fs::create_dir_all(&json_dir) {
        println!("cargo:warning=❌ jsonサブディレクトリ作成失敗: {}", e);
    } else {
        println!(
            "cargo:warning=📁 jsonディレクトリ作成完了: {}",
            json_dir.display()
        );
    }

    println!("cargo:warning=✅ Automergeテスト出力ディレクトリセットアップ完了");
}
