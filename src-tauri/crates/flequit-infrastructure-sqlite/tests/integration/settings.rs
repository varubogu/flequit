//! 設定単体テスト
//!
//! testing.mdルール準拠のSQLite設定リポジトリテスト

use flequit_model::models::setting::{Settings, CustomDateFormat, DueDateButtons};
use flequit_model::types::id_types::SettingsId;
use flequit_storage::infrastructure::local_sqlite::database_manager::DatabaseManager;
use flequit_storage::infrastructure::local_sqlite::app_settings::settings::SettingsLocalSqliteRepository;
use flequit_storage::repositories::base_repository_trait::Repository;
use flequit_storage::repositories::setting_repository_trait::SettingRepositoryTrait;
use std::sync::Arc;

use crate::setup_sqlite_test;

#[tokio::test]
async fn test_settings_create_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_settings_create_operation")?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let settings_repo = SettingsLocalSqliteRepository::new(db_manager_arc);

    // テストデータ作成
    let settings = Settings {
        id: SettingsId::from("app_settings"),
        theme: "dark".to_string(),
        language: "en".to_string(),
        font: "Arial".to_string(),
        font_size: 16,
        font_color: "#FFFFFF".to_string(),
        background_color: "#000000".to_string(),
        week_start: "sunday".to_string(),
        timezone: "UTC".to_string(),
        date_format: "DD/MM/YYYY".to_string(),
        custom_due_days: vec![1, 7, 30],
        custom_date_formats: vec![],
        time_labels: vec![],
        due_date_buttons: DueDateButtons {
            overdue: true,
            today: true,
            tomorrow: false,
            three_days: true,
            this_week: false,
            this_month: true,
            this_quarter: false,
            this_year: true,
            this_year_end: false,
        },
        view_items: vec![],
        last_selected_account: "test_account".to_string(),
    };

    // Create操作（saveメソッドを使用）
    settings_repo.save(&settings).await?;

    // 作成確認
    let retrieved_settings = settings_repo.get_settings().await?;
    assert!(retrieved_settings.is_some());
    let retrieved_settings = retrieved_settings.unwrap();
    // 設定の各属性値を確認
    assert_eq!(retrieved_settings.theme, settings.theme);
    assert_eq!(retrieved_settings.language, settings.language);
    assert_eq!(retrieved_settings.font, settings.font);
    assert_eq!(retrieved_settings.font_size, settings.font_size);
    assert_eq!(retrieved_settings.font_color, settings.font_color);
    assert_eq!(retrieved_settings.background_color, settings.background_color);

    Ok(())
}

#[tokio::test]
async fn test_settings_read_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_settings_read_operation")?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let settings_repo = SettingsLocalSqliteRepository::new(db_manager_arc);

    // テストデータ作成・保存
    let settings = Settings {
        id: SettingsId::from("app_settings"),
        theme: "light".to_string(),
        language: "ja".to_string(),
        font: "Helvetica".to_string(),
        font_size: 14,
        font_color: "#000000".to_string(),
        background_color: "#FFFFFF".to_string(),
        week_start: "monday".to_string(),
        timezone: "Asia/Tokyo".to_string(),
        date_format: "YYYY-MM-DD".to_string(),
        custom_due_days: vec![3, 7, 14],
        custom_date_formats: vec![],
        time_labels: vec![],
        due_date_buttons: DueDateButtons::default(),
        view_items: vec![],
        last_selected_account: "".to_string(),
    };

    settings_repo.save(&settings).await?;

    // Read操作
    let retrieved_settings = settings_repo.get_settings().await?;
    assert!(retrieved_settings.is_some());
    let retrieved_settings = retrieved_settings.unwrap();
    // 設定の各属性値を確認
    assert_eq!(retrieved_settings.theme, settings.theme);
    assert_eq!(retrieved_settings.language, settings.language);
    assert_eq!(retrieved_settings.font, settings.font);
    assert_eq!(retrieved_settings.font_size, settings.font_size);
    assert_eq!(retrieved_settings.timezone, settings.timezone);
    assert_eq!(retrieved_settings.date_format, settings.date_format);

    Ok(())
}

#[tokio::test]
async fn test_settings_update_operation() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_settings_update_operation")?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let settings_repo = SettingsLocalSqliteRepository::new(db_manager_arc);

    // 初期テストデータ作成・保存
    let initial_settings = Settings {
        id: SettingsId::from("app_settings"),
        theme: "system".to_string(),
        language: "ja".to_string(),
        font: "system".to_string(),
        font_size: 14,
        font_color: "#000000".to_string(),
        background_color: "#FFFFFF".to_string(),
        week_start: "monday".to_string(),
        timezone: "Asia/Tokyo".to_string(),
        date_format: "YYYY-MM-DD".to_string(),
        custom_due_days: vec![1, 3, 7],
        custom_date_formats: vec![],
        time_labels: vec![],
        due_date_buttons: DueDateButtons::default(),
        view_items: vec![],
        last_selected_account: "".to_string(),
    };

    settings_repo.save(&initial_settings).await?;

    // Update操作
    let updated_settings = Settings {
        id: SettingsId::from("app_settings"),
        theme: "dark".to_string(),
        language: "en".to_string(),
        font: "Courier".to_string(),
        font_size: 18,
        font_color: "#FFFFFF".to_string(),
        background_color: "#2D2D2D".to_string(),
        week_start: "sunday".to_string(),
        timezone: "UTC".to_string(),
        date_format: "MM-DD-YYYY".to_string(),
        custom_due_days: vec![7, 14, 30],
        custom_date_formats: vec![],
        time_labels: vec![],
        due_date_buttons: DueDateButtons {
            overdue: false,
            today: true,
            tomorrow: true,
            three_days: false,
            this_week: true,
            this_month: false,
            this_quarter: true,
            this_year: false,
            this_year_end: true,
        },
        view_items: vec![],
        last_selected_account: "updated_account".to_string(),
    };

    settings_repo.save(&updated_settings).await?;

    // 更新後の取得確認
    let retrieved_updated = settings_repo.get_settings().await?;
    assert!(retrieved_updated.is_some());
    let retrieved_updated = retrieved_updated.unwrap();
    assert_eq!(retrieved_updated.theme, updated_settings.theme);
    assert_eq!(retrieved_updated.language, updated_settings.language);
    assert_eq!(retrieved_updated.font, updated_settings.font);
    assert_eq!(retrieved_updated.font_size, updated_settings.font_size);
    assert_eq!(retrieved_updated.timezone, updated_settings.timezone);
    assert_eq!(retrieved_updated.last_selected_account, updated_settings.last_selected_account);

    Ok(())
}

#[tokio::test]
async fn test_custom_date_format_operations() -> Result<(), Box<dyn std::error::Error>> {
    // テストデータベースを作成
    let db_path = setup_sqlite_test!("test_custom_date_format_operations")?;

    // リポジトリを初期化（非シングルトン）
    let db_manager = DatabaseManager::new_for_test(db_path.to_string_lossy().to_string());
    let db_manager_arc = Arc::new(tokio::sync::RwLock::new(db_manager));
    let settings_repo = SettingsLocalSqliteRepository::new(db_manager_arc);

    // テストデータ作成
    let custom_format1 = CustomDateFormat {
        id: "format1".to_string(),
        name: "日本語形式".to_string(),
        format: "YYYY年MM月DD日".to_string(),
    };

    let custom_format2 = CustomDateFormat {
        id: "format2".to_string(),
        name: "US形式".to_string(),
        format: "MM/DD/YYYY".to_string(),
    };

    // Create操作
    settings_repo.add_custom_date_format(&custom_format1).await?;
    settings_repo.add_custom_date_format(&custom_format2).await?;

    // Read操作（単体）
    let retrieved_format1 = settings_repo.get_custom_date_format("format1").await?;
    assert!(retrieved_format1.is_some());
    let retrieved_format1 = retrieved_format1.unwrap();
    assert_eq!(retrieved_format1.name, custom_format1.name);
    assert_eq!(retrieved_format1.format, custom_format1.format);

    // Read操作（全件）
    let all_formats = settings_repo.get_all_custom_date_formats().await?;
    assert_eq!(all_formats.len(), 2);

    // Update操作
    let updated_format1 = CustomDateFormat {
        id: "format1".to_string(),
        name: "更新された日本語形式".to_string(),
        format: "YYYY/MM/DD".to_string(),
    };

    settings_repo.update_custom_date_format(&updated_format1).await?;

    let retrieved_updated = settings_repo.get_custom_date_format("format1").await?;
    assert!(retrieved_updated.is_some());
    let retrieved_updated = retrieved_updated.unwrap();
    assert_eq!(retrieved_updated.name, updated_format1.name);
    assert_eq!(retrieved_updated.format, updated_format1.format);

    // Delete操作
    settings_repo.delete_custom_date_format("format1").await?;

    let deleted_check = settings_repo.get_custom_date_format("format1").await?;
    assert!(deleted_check.is_none());

    // format2が削除されていないことを確認
    let format2_check = settings_repo.get_custom_date_format("format2").await?;
    assert!(format2_check.is_some());

    Ok(())
}

#[tokio::test]
async fn test_repository_isolation() -> Result<(), Box<dyn std::error::Error>> {
    // 複数のテストが独立していることを確認
    let db_path1 = setup_sqlite_test!("test_settings_repository_isolation_1")?;
    let db_path2 = setup_sqlite_test!("test_settings_repository_isolation_2")?;

    // 異なるデータベースパスを使用していることを確認
    assert_ne!(db_path1, db_path2);

    // それぞれのデータベースが独立して動作することを確認
    let db_manager1 = DatabaseManager::new_for_test(db_path1.to_string_lossy().to_string());
    let db_manager2 = DatabaseManager::new_for_test(db_path2.to_string_lossy().to_string());

    let settings_repo1 = SettingsLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager1)));
    let settings_repo2 = SettingsLocalSqliteRepository::new(Arc::new(tokio::sync::RwLock::new(db_manager2)));

    // DB1に設定作成
    let settings1 = Settings {
        id: SettingsId::from("app_settings"),
        theme: "dark".to_string(),
        language: "ja".to_string(),
        ..Settings::default()
    };
    settings_repo1.save(&settings1).await?;

    // DB2からは見えないことを確認（デフォルト値または存在しない）
    let not_found = settings_repo2.get_settings().await?;
    if let Some(settings) = not_found {
        // デフォルト値と比較（DB1の設定と異なることを確認）
        assert_ne!(settings.theme, settings1.theme);
    }

    // DB2にも別の設定作成
    let settings2 = Settings {
        id: SettingsId::from("app_settings"),
        theme: "light".to_string(),
        language: "en".to_string(),
        ..Settings::default()
    };
    settings_repo2.save(&settings2).await?;

    // DB1の設定が変更されていないことを確認
    let db1_settings = settings_repo1.get_settings().await?;
    assert!(db1_settings.is_some());
    let db1_settings = db1_settings.unwrap();
    assert_eq!(db1_settings.theme, settings1.theme);
    assert_eq!(db1_settings.language, settings1.language);

    println!("✅ テストデータベース分離確認完了");

    Ok(())
}
