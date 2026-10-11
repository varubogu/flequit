//! 新しい設定管理API統合テスト

use flequit_settings::{Settings, SettingsManager};
use tempfile::TempDir;

/// 一時ディレクトリ上の設定ファイルで SettingsManager を作る。
///
/// `std::env::set_var` は Rust 2024 で unsafe であり、`#[tokio::test]` の
/// マルチスレッドランタイム上で呼ぶと他スレッドの環境変数読み取りと競合する。
/// パスを直接渡してプロセス環境は変更しない。
fn setup_test_manager() -> (TempDir, SettingsManager) {
    let temp_dir = TempDir::new().unwrap();
    let settings_path = temp_dir.path().join("settings.yml");
    let manager = SettingsManager::new_with_path(settings_path);
    (temp_dir, manager)
}

#[tokio::test]
async fn test_config_file_operations() {
    let (_temp_dir, config_manager) = setup_test_manager();

    // 2. 初期状態では設定ファイルが存在しない
    let exists = config_manager.settings_exists();
    assert!(!exists, "設定ファイルは初期状態では存在しないはず");

    // 3. デフォルト設定で初期化
    config_manager.initialize_with_defaults().await.unwrap();

    let exists_after_init = config_manager.settings_exists();
    assert!(exists_after_init, "初期化後は設定ファイルが存在するはず");

    // 4. 設定ファイルパスの確認
    let config_path = config_manager.get_settings_path();
    assert!(config_path.exists(), "設定ファイルが実際に存在するはず");
    assert!(
        config_path.to_string_lossy().ends_with("settings.yml"),
        "ファイル名がsettings.ymlであるはず"
    );

    println!("✅ 設定ファイルパス: {}", config_path.display());
}

#[tokio::test]
async fn test_settings_load_and_save() {
    let (_temp_dir, config_manager) = setup_test_manager();

    // 2. デフォルト設定で初期化
    config_manager.initialize_with_defaults().await.unwrap();

    // 3. 設定を読み込み
    let settings = config_manager.load_settings().await.unwrap();

    // デフォルト値の確認
    assert_eq!(settings.theme, "system");
    assert_eq!(settings.language, "ja");
    assert_eq!(settings.font_size, 14);
    assert_eq!(settings.week_start, "monday");
    assert_eq!(settings.timezone, "Asia/Tokyo");
    assert_eq!(settings.custom_due_days, vec![1, 3, 7, 14, 30]);

    println!("✅ デフォルト設定読み込み成功");

    // 4. 設定を変更して保存
    let mut modified_settings = settings;
    modified_settings.theme = "dark".to_string();
    modified_settings.language = "en".to_string();
    modified_settings.font_size = 16;
    modified_settings.custom_due_days = vec![1, 7, 30];

    config_manager
        .save_settings(&modified_settings)
        .await
        .unwrap();
    println!("✅ 設定保存成功");

    // 5. 保存した設定を再読み込みして確認
    let reloaded_settings = config_manager.load_settings().await.unwrap();

    assert_eq!(reloaded_settings.theme, "dark");
    assert_eq!(reloaded_settings.language, "en");
    assert_eq!(reloaded_settings.font_size, 16);
    assert_eq!(reloaded_settings.custom_due_days, vec![1, 7, 30]);

    println!("✅ 設定の永続化確認成功");
}

#[tokio::test]
async fn test_invalid_settings_validation() {
    let (_temp_dir, config_manager) = setup_test_manager();

    // 無効な設定値でテスト
    let mut invalid_settings = Settings::default();
    invalid_settings.theme = "invalid_theme".to_string(); // 無効なテーマ
    invalid_settings.font_size = 100; // 無効なフォントサイズ（範囲外）
    invalid_settings.week_start = "invalid_day".to_string(); // 無効な週開始日

    // バリデーションエラーが発生することを確認
    let result = config_manager.save_settings(&invalid_settings).await;
    assert!(
        result.is_err(),
        "無効な設定値でバリデーションエラーが発生するはず"
    );

    println!("✅ 設定値バリデーション動作確認");
}
