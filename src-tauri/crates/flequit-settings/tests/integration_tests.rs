//! 統合テスト

use flequit_settings::{Settings, SettingsManager};
use flequit_testing::TestPathGenerator;
use log::info;
use std::env;

#[test]
fn test_config_manager_creation() {
    // プロジェクトルール準拠のテストディレクトリを作成
    let test_dir = TestPathGenerator::generate_test_dir(file!(), "test_config_manager_creation");
    std::fs::create_dir_all(&test_dir).unwrap();
    env::set_var("HOME", test_dir);

    let config_manager = SettingsManager::new();
    assert!(config_manager.is_ok());
}

#[test]
fn test_default_settings() {
    let settings = Settings::default();

    assert_eq!(settings.theme, "system");
    assert_eq!(settings.language, "ja");
    assert_eq!(settings.font_size, 14);
    assert_eq!(settings.week_start, "monday");
    assert_eq!(settings.timezone, "Asia/Tokyo");
    assert_eq!(settings.custom_due_days, vec![1, 3, 7, 14, 30]);
}

#[test]
fn test_settings_serialization() {
    let settings = Settings::default();

    // YAMLにシリアライズ
    let yaml_str = serde_yaml::to_string(&settings).unwrap();
    assert!(yaml_str.contains("theme: system"));
    assert!(yaml_str.contains("language: ja"));

    // YAMLからデシリアライズ
    let deserialized: Settings = serde_yaml::from_str(&yaml_str).unwrap();
    assert_eq!(deserialized.theme, settings.theme);
    assert_eq!(deserialized.language, settings.language);
}

#[tokio::test]
async fn test_auto_create_config_file() {
    // プロジェクトルール準拠のテストディレクトリを作成
    let test_dir = TestPathGenerator::generate_test_dir(file!(), "test_auto_create_config_file");
    std::fs::create_dir_all(&test_dir).unwrap();
    let test_settings_path = test_dir.join("test_auto_create.yml");
    info!("Test settings path: {}", test_settings_path.display());

    // SettingsManagerをテスト用メソッドで作成（設定ディレクトリの自動作成を回避）
    let config_manager = SettingsManager::new_with_path(test_settings_path.clone());

    // 初期状態では設定ファイルが存在しない
    assert!(
        !config_manager.settings_exists(),
        "初期状態では設定ファイルは存在しないはず"
    );

    // load_settingsを呼び出すと自動的に設定ファイルが作成される
    let settings = config_manager.load_settings().await.unwrap();

    // デフォルト値が取得できることを確認
    assert_eq!(settings.theme, "system");
    assert_eq!(settings.language, "ja");
    assert_eq!(settings.font_size, 14);

    // 設定ファイルが作成されていることを確認
    assert!(
        config_manager.settings_exists(),
        "load_settings後は設定ファイルが存在するはず"
    );
    assert!(
        config_manager.get_settings_path().exists(),
        "設定ファイルが実際に存在するはず"
    );

    // 作成されたファイルを再読み込みして同じ内容が得られることを確認
    let reloaded_settings = config_manager.load_settings().await.unwrap();
    assert_eq!(reloaded_settings.theme, settings.theme);
    assert_eq!(reloaded_settings.language, settings.language);
    assert_eq!(reloaded_settings.font_size, settings.font_size);
}

#[tokio::test]
async fn test_config_file_with_folder_creation() {
    // プロジェクトルール準拠のテストディレクトリを作成
    let test_dir =
        TestPathGenerator::generate_test_dir(file!(), "test_config_file_with_folder_creation");
    let test_config_dir = test_dir.join("config_test_dir");
    let test_settings_path = test_config_dir.join("test_folder_create.yml");

    // SettingsManagerをテスト用メソッドで作成
    let settings_manager = SettingsManager::new_with_path(test_settings_path.clone());

    // 設定ディレクトリとファイルが存在しないことを確認
    let config_path = settings_manager.get_settings_path();
    let config_dir = config_path.parent().unwrap();

    assert!(
        !config_dir.exists(),
        "初期状態では設定ディレクトリは存在しないはず"
    );
    assert!(
        !config_path.exists(),
        "初期状態では設定ファイルは存在しないはず"
    );

    // load_settingsを呼び出すと、ディレクトリとファイルの両方が作成される
    let settings = settings_manager.load_settings().await.unwrap();

    // ディレクトリが作成されていることを確認
    assert!(config_dir.exists(), "設定ディレクトリが作成されているはず");
    assert!(
        config_dir.is_dir(),
        "設定ディレクトリがディレクトリであるはず"
    );

    // ファイルが作成されていることを確認
    assert!(config_path.exists(), "設定ファイルが作成されているはず");
    assert!(config_path.is_file(), "設定ファイルがファイルであるはず");

    // デフォルト設定が正しく保存されていることを確認
    assert_eq!(settings.theme, "system");
    assert_eq!(settings.language, "ja");
}

#[cfg(test)]
mod validation_tests {
    use flequit_settings::validation::SettingsValidator;
    use flequit_settings::Settings;

    #[test]
    fn test_valid_settings() {
        let settings = Settings::default();
        assert!(SettingsValidator::validate(&settings).is_ok());
    }

    #[test]
    fn test_invalid_theme() {
        let mut settings = Settings::default();
        settings.theme = "invalid_theme".to_string();

        let result = SettingsValidator::validate(&settings);
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_font_size() {
        let mut settings = Settings::default();
        settings.font_size = 100; // 範囲外

        let result = SettingsValidator::validate(&settings);
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_week_start() {
        let mut settings = Settings::default();
        settings.week_start = "invalid_day".to_string();

        let result = SettingsValidator::validate(&settings);
        assert!(result.is_err());
    }
}
