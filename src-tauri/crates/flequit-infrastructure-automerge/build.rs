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

    create_test_output_directories();
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
fn create_test_output_directories() {
    println!("cargo:warning=🔧 Automergeテスト出力ディレクトリ作成開始 (infra-automerge)");

    let project_root = resolve_project_root();
    println!(
        "cargo:warning=🏠 プロジェクトルート: {}",
        project_root.display()
    );
    let output_dir = project_root.join(".tmp/tests/cargo/flequit-infrastructure-automerge");

    if output_dir.exists() {
        println!(
            "cargo:warning=ℹ️ 既存ディレクトリを再利用: {}",
            output_dir.display()
        );
        return;
    }

    if let Err(e) = std::fs::create_dir_all(&output_dir) {
        println!("cargo:warning=❌ テスト出力ディレクトリ作成失敗: {}", e);
        return;
    }

    let automerge_dir = output_dir.join("automerge");
    let json_dir = output_dir.join("json");

    if let Err(e) = std::fs::create_dir_all(&automerge_dir) {
        println!("cargo:warning=❌ automergeサブディレクトリ作成失敗: {}", e);
        return;
    }

    if let Err(e) = std::fs::create_dir_all(&json_dir) {
        println!("cargo:warning=❌ jsonサブディレクトリ作成失敗: {}", e);
        return;
    }

    println!(
        "cargo:warning=✅ Automergeテスト出力ディレクトリセットアップ完了: {}",
        output_dir.display()
    );
}
