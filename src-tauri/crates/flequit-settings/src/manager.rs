//! 設定マネージャー
//!
//! このモジュールは設定の読み書きと管理を行います。

use crate::errors::{SettingsError, SettingsResult};
use crate::models::settings::{PartialSettings, Settings};
use crate::paths::SettingsPaths;
use crate::validation::SettingsValidator;
use log::{debug, info, warn};
use std::path::PathBuf;

/// 設定マネージャー
///
/// YAML形式の設定ファイルの読み書きと管理を行います。
#[derive(Debug)]
pub struct SettingsManager {
    settings_path: PathBuf,
}

impl SettingsManager {
    /// 新しい設定マネージャーを作成
    pub fn new() -> SettingsResult<Self> {
        SettingsPaths::ensure_settings_dir_exists()?;
        let settings_path = SettingsPaths::get_settings_file_path()?;

        debug!(
            "SettingsManager initialized with path: {}",
            settings_path.display()
        );

        Ok(Self { settings_path })
    }

    /// テスト用：指定パスで設定マネージャーを作成
    #[doc(hidden)]
    pub fn new_with_path(settings_path: PathBuf) -> Self {
        Self { settings_path }
    }

    /// 設定ファイルパスを取得
    pub fn get_settings_path(&self) -> &PathBuf {
        &self.settings_path
    }

    /// 設定を読み込み
    ///
    /// 設定ファイルが存在しない場合は自動的にデフォルト設定ファイルを作成してから読み込みます。
    /// ファイルが存在する場合はYAMLを解析して設定を読み込みます。
    pub async fn load_settings(&self) -> SettingsResult<Settings> {
        if !self.settings_path.exists() {
            info!("設定ファイルが存在しません。デフォルト設定ファイルを作成します。");

            // デフォルト設定を作成・保存
            let default_settings = Settings::default();
            self.save_settings(&default_settings).await?;

            info!(
                "デフォルト設定ファイルを作成しました: {}",
                self.settings_path.display()
            );
            return Ok(default_settings);
        }

        debug!("設定ファイルを読み込み中: {}", self.settings_path.display());

        let content = std::fs::read_to_string(&self.settings_path).map_err(|e| {
            warn!("設定ファイルの読み取りに失敗: {}", e);
            SettingsError::ReadError { source: e }
        })?;

        let settings: Settings = serde_yaml::from_str(&content).map_err(|e| {
            warn!("YAML解析に失敗: {}", e);
            SettingsError::YamlParseError { source: e }
        })?;

        // 設定値を検証
        SettingsValidator::validate(&settings)?;

        info!("設定ファイルの読み込みが完了しました");
        Ok(settings)
    }

    /// 設定を保存
    ///
    /// 設定をYAML形式で設定ファイルに保存します。
    /// 保存前に設定値の検証を行います。
    pub async fn save_settings(&self, settings: &Settings) -> SettingsResult<()> {
        debug!("設定を保存中: {}", self.settings_path.display());

        // 設定値を検証
        SettingsValidator::validate(settings)?;

        // YAMLに変換
        let yaml_content = serde_yaml::to_string(settings).map_err(|e| {
            warn!("YAML変換に失敗: {}", e);
            SettingsError::YamlParseError { source: e }
        })?;

        // 親ディレクトリが存在しない場合は作成
        if let Some(parent_dir) = self.settings_path.parent() {
            if !parent_dir.exists() {
                std::fs::create_dir_all(parent_dir).map_err(|_| {
                    SettingsError::DirectoryCreationError {
                        path: parent_dir.display().to_string(),
                    }
                })?;
            }
        }

        // ファイルに書き込み
        std::fs::write(&self.settings_path, yaml_content).map_err(|e| {
            warn!("設定ファイルの書き込みに失敗: {}", e);
            SettingsError::WriteError {
                path: self.settings_path.display().to_string(),
            }
        })?;

        info!("設定ファイルの保存が完了しました");
        Ok(())
    }

    /// 設定ファイルが存在するかチェック
    pub fn settings_exists(&self) -> bool {
        self.settings_path.exists()
    }

    /// デフォルト設定でファイルを初期化
    ///
    /// 設定ファイルが存在しない場合に、デフォルト設定で新規作成します。
    pub async fn initialize_with_defaults(&self) -> SettingsResult<()> {
        if self.settings_exists() {
            debug!("設定ファイルは既に存在します");
            return Ok(());
        }

        info!("デフォルト設定で設定ファイルを初期化します");
        let default_settings = Settings::default();
        self.save_settings(&default_settings).await
    }

    /// 部分的な設定更新を適用
    ///
    /// 既存の設定を読み込み、部分的な設定を適用してから保存します。
    /// 設定ファイルが存在しない場合は自動的にデフォルト設定で初期化してから更新します。
    pub async fn update_settings_partially(
        &self,
        partial: &PartialSettings,
    ) -> SettingsResult<Settings> {
        debug!("部分的な設定更新を開始");

        // 既存の設定を読み込み（存在しない場合はデフォルト設定を作成）
        let mut current_settings = self.load_settings().await?;

        // 部分的な設定を適用
        self.apply_partial_settings(&mut current_settings, partial);

        // 更新された設定を保存
        self.save_settings(&current_settings).await?;

        info!("部分的な設定更新が完了しました");
        Ok(current_settings)
    }

    /// PartialSettingsを既存のSettingsに適用する内部メソッド
    fn apply_partial_settings(&self, target: &mut Settings, partial: &PartialSettings) {
        // テーマ・外観設定
        if let Some(theme) = &partial.theme {
            target.theme = theme.clone();
        }
        if let Some(language) = &partial.language {
            target.language = language.clone();
        }
        if let Some(font) = &partial.font {
            target.font = font.clone();
        }
        if let Some(font_size) = partial.font_size {
            target.font_size = font_size;
        }
        if let Some(font_color) = &partial.font_color {
            target.font_color = font_color.clone();
        }
        if let Some(background_color) = &partial.background_color {
            target.background_color = background_color.clone();
        }

        // 基本設定
        if let Some(week_start) = &partial.week_start {
            target.week_start = week_start.clone();
        }
        if let Some(timezone) = &partial.timezone {
            target.timezone = timezone.clone();
        }
        if let Some(custom_due_days) = &partial.custom_due_days {
            target.custom_due_days = custom_due_days.clone();
        }
        if let Some(datetime_format) = &partial.datetime_format {
            target.datetime_format = datetime_format.clone();
        }
        if let Some(datetime_formats) = &partial.datetime_formats {
            target.datetime_formats = datetime_formats.clone();
        }
        if let Some(time_labels) = &partial.time_labels {
            target.time_labels = time_labels.clone();
        }

        // 表示設定
        if let Some(due_date_buttons) = &partial.due_date_buttons {
            target.due_date_buttons = due_date_buttons.clone();
        }
        if let Some(view_items) = &partial.view_items {
            target.view_items = view_items.clone();
        }
    }
}

impl Default for SettingsManager {
    fn default() -> Self {
        Self::new().expect("SettingsManagerの作成に失敗しました")
    }
}
