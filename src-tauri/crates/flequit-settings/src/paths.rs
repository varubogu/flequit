//! 設定ファイルパス管理
//!
//! このモジュールは設定ファイルのパス解決と管理を行います。

use crate::errors::{SettingsError, SettingsResult};
use directories::ProjectDirs;
use std::path::PathBuf;

/// 設定ファイル名
const SETTINGS_FILE_NAME: &str = "settings.yml";

/// アプリケーション名（設定フォルダ用）
const APP_NAME: &str = "flequit";

/// 設定ファイルのパス管理
pub struct SettingsPaths;

impl SettingsPaths {
    /// 設定ディレクトリのパスを取得
    ///
    /// OS固有の設定ディレクトリを返します。
    /// - Windows: %APPDATA%/flequit
    /// - macOS: ~/Library/Application Support/flequit
    /// - Linux: ~/.config/flequit
    pub fn get_settings_dir() -> SettingsResult<PathBuf> {
        ProjectDirs::from("", "", APP_NAME)
            .ok_or(SettingsError::PathError)?
            .config_dir()
            .to_path_buf()
            .pipe(Ok)
    }

    /// 設定ファイルのフルパスを取得
    ///
    /// 設定ディレクトリにsettings.ymlを結合したパスを返します。
    pub fn get_settings_file_path() -> SettingsResult<PathBuf> {
        let settings_dir = Self::get_settings_dir()?;
        Ok(settings_dir.join(SETTINGS_FILE_NAME))
    }

    /// 設定ディレクトリが存在しない場合は作成
    pub fn ensure_settings_dir_exists() -> SettingsResult<PathBuf> {
        let settings_dir = Self::get_settings_dir()?;

        if !settings_dir.exists() {
            std::fs::create_dir_all(&settings_dir)
                .map_err(|_| SettingsError::DirectoryCreationError {
                    path: settings_dir.display().to_string(),
                })?;
        }

        Ok(settings_dir)
    }
}

/// パイプライン演算子のトレイト
trait Pipe<T> {
    fn pipe<F, R>(self, f: F) -> R
    where
        F: FnOnce(T) -> R;
}

impl<T> Pipe<T> for T {
    fn pipe<F, R>(self, f: F) -> R
    where
        F: FnOnce(T) -> R,
    {
        f(self)
    }
}
