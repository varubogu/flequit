//! Settings用リポジトリトレイト
//!
//! 設定データの保存・読み込み・バリデーション機能を提供します。

use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{Settings, ViewItem, CustomDateFormat, TimeLabel, DueDateButtons};
use async_trait::async_trait;

/// 設定バリデーションエラー
#[derive(Debug, Clone)]
pub struct SettingsValidationError {
    /// エラーが発生したフィールド名
    pub field: String,
    /// エラーメッセージ
    pub message: String,
}

/// 設定バリデーター
pub struct SettingsValidator;

impl SettingsValidator {
    /// 設定データのバリデーションを実行
    pub fn validate(settings: &Settings) -> Vec<SettingsValidationError> {
        let mut errors = Vec::new();
        
        // テーマ検証
        if !["system", "light", "dark"].contains(&settings.theme.as_str()) {
            errors.push(SettingsValidationError {
                field: "theme".to_string(),
                message: "テーマは 'system', 'light', 'dark' のいずれかである必要があります".to_string(),
            });
        }
        
        // 言語検証
        if !["ja", "en"].contains(&settings.language.as_str()) {
            errors.push(SettingsValidationError {
                field: "language".to_string(),
                message: "言語は 'ja', 'en' のいずれかである必要があります".to_string(),
            });
        }
        
        // フォントサイズ検証
        if settings.font_size < 8 || settings.font_size > 72 {
            errors.push(SettingsValidationError {
                field: "font_size".to_string(),
                message: "フォントサイズは8-72の範囲で指定してください".to_string(),
            });
        }
        
        // 週の開始曜日検証
        if !["sunday", "monday"].contains(&settings.week_start.as_str()) {
            errors.push(SettingsValidationError {
                field: "week_start".to_string(),
                message: "週の開始曜日は 'sunday', 'monday' のいずれかである必要があります".to_string(),
            });
        }
        
        // CustomDateFormatのID重複チェック
        let mut format_ids = std::collections::HashSet::new();
        for format in &settings.custom_date_formats {
            if !format_ids.insert(&format.id) {
                errors.push(SettingsValidationError {
                    field: "custom_date_formats".to_string(),
                    message: format!("日付フォーマットID '{}' が重複しています", format.id),
                });
            }
        }
        
        // TimeLabelのID重複チェック
        let mut label_ids = std::collections::HashSet::new();
        for label in &settings.time_labels {
            if !label_ids.insert(&label.id) {
                errors.push(SettingsValidationError {
                    field: "time_labels".to_string(),
                    message: format!("時刻ラベルID '{}' が重複しています", label.id),
                });
            }
            
            // 時刻フォーマット検証（HH:mm形式）
            if !label.time.matches(':').count() == 1 || label.time.len() != 5 {
                errors.push(SettingsValidationError {
                    field: "time_labels".to_string(),
                    message: format!("時刻ラベル '{}' の時刻フォーマットが不正です（HH:mm形式で入力してください）", label.id),
                });
            }
        }
        
        // ViewItemのID重複チェック
        let mut view_item_ids = std::collections::HashSet::new();
        for item in &settings.view_items {
            if !view_item_ids.insert(&item.id) {
                errors.push(SettingsValidationError {
                    field: "view_items".to_string(),
                    message: format!("ビューアイテムID '{}' が重複しています", item.id),
                });
            }
        }
        
        errors
    }
    
    /// デフォルト設定を生成
    pub fn create_default() -> Settings {
        Settings {
            theme: "system".to_string(),
            language: "ja".to_string(),
            font: "system-ui".to_string(),
            font_size: 14,
            font_color: "#000000".to_string(),
            background_color: "#ffffff".to_string(),
            week_start: "monday".to_string(),
            timezone: "Asia/Tokyo".to_string(),
            date_format: "YYYY-MM-DD".to_string(),
            custom_due_days: vec![1, 3, 7, 14, 30],
            custom_date_formats: vec![],
            time_labels: vec![],
            due_date_buttons: DueDateButtons {
                overdue: true,
                today: true,
                tomorrow: true,
                three_days: true,
                this_week: true,
                this_month: true,
                this_quarter: false,
                this_year: false,
                this_year_end: false,
            },
            view_items: vec![],
            selected_account: "default".to_string(),
            account_icon: None,
            account_name: "Default Account".to_string(),
            email: "".to_string(),
            password: "".to_string(),
            server_url: "".to_string(),
        }
    }
}

/// 設定データリポジトリトレイト
#[async_trait]
pub trait SettingsRepository {
    /// 設定データを読み込み
    async fn load(&self) -> Result<Settings, RepositoryError>;
    
    /// 設定データを保存（バリデーションなし）
    async fn save(&self, settings: &Settings) -> Result<(), RepositoryError>;
    
    /// 設定データを保存（バリデーション付き）
    async fn save_with_validation(&self, settings: &Settings) -> Result<(), RepositoryError>;
    
    /// デフォルト設定にリセット
    async fn reset_to_default(&self) -> Result<Settings, RepositoryError>;
    
    /// 設定データのバリデーション
    fn validate(&self, settings: &Settings) -> Vec<SettingsValidationError>;
    
    // 部分更新メソッド群
    /// テーマを更新
    async fn update_theme(&self, theme: String) -> Result<(), RepositoryError>;
    
    /// 言語を更新
    async fn update_language(&self, language: String) -> Result<(), RepositoryError>;
    
    /// カスタム日付フォーマットを更新
    async fn update_custom_date_formats(&self, formats: Vec<CustomDateFormat>) -> Result<(), RepositoryError>;
    
    /// 時刻ラベルを更新
    async fn update_time_labels(&self, labels: Vec<TimeLabel>) -> Result<(), RepositoryError>;
    
    /// ビューアイテムを更新
    async fn update_view_items(&self, items: Vec<ViewItem>) -> Result<(), RepositoryError>;
    
    /// 期日ボタン設定を更新
    async fn update_due_date_buttons(&self, buttons: DueDateButtons) -> Result<(), RepositoryError>;
    
    // ネストした構造体の個別操作
    /// カスタム日付フォーマットを追加
    async fn add_custom_date_format(&self, format: CustomDateFormat) -> Result<(), RepositoryError>;
    
    /// カスタム日付フォーマットを削除
    async fn remove_custom_date_format(&self, format_id: &str) -> Result<(), RepositoryError>;
    
    /// 時刻ラベルを追加
    async fn add_time_label(&self, label: TimeLabel) -> Result<(), RepositoryError>;
    
    /// 時刻ラベルを削除
    async fn remove_time_label(&self, label_id: &str) -> Result<(), RepositoryError>;
    
    /// ビューアイテムを追加
    async fn add_view_item(&self, item: ViewItem) -> Result<(), RepositoryError>;
    
    /// ビューアイテムを削除
    async fn remove_view_item(&self, item_id: &str) -> Result<(), RepositoryError>;
}