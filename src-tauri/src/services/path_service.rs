use std::path::PathBuf;
use std::fs;
use serde::{Deserialize, Serialize};
use crate::types::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathConfig {
    pub data_dir: Option<PathBuf>,
    pub backup_dir: Option<PathBuf>,
    pub export_dir: Option<PathBuf>,
    pub use_system_default: bool,
}

impl Default for PathConfig {
    fn default() -> Self {
        Self {
            data_dir: None,
            backup_dir: None,
            export_dir: None,
            use_system_default: true,
        }
    }
}

pub struct PathService {
    config: PathConfig,
}

impl PathService {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let config = Self::load_config().unwrap_or_default();
        Ok(Self { config })
    }

    pub fn with_config(config: PathConfig) -> Self {
        Self { config }
    }

    /// OS別のデフォルトデータディレクトリを取得
    pub fn get_default_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
        #[cfg(target_os = "windows")]
        {
            // Windows: ~/AppData/Local/flequit/
            if let Some(local_data) = dirs::data_local_dir() {
                return Ok(local_data.join("flequit"));
            }
        }

        #[cfg(target_os = "macos")]
        {
            // macOS: ~/Library/Application Support/flequit/
            if let Some(app_support) = dirs::data_dir() {
                return Ok(app_support.join("flequit"));
            }
        }

        #[cfg(target_os = "linux")]
        {
            // Linux: XDG_DATA_HOME優先、なければ ~/.local/share/flequit/
            if let Some(data_dir) = dirs::data_local_dir() {
                return Ok(data_dir.join("flequit"));
            }
            // Fallback to ~/.flequit
            if let Some(home) = dirs::home_dir() {
                return Ok(home.join(".flequit"));
            }
        }

        #[cfg(target_os = "android")]
        {
            // Android: アプリの内部ストレージ
            // Tauriのアプリディレクトリを使用
            if let Some(data_dir) = dirs::data_dir() {
                return Ok(data_dir.join("flequit"));
            }
        }

        #[cfg(target_os = "ios")]
        {
            // iOS: Documents directory
            if let Some(document_dir) = dirs::document_dir() {
                return Ok(document_dir.join("flequit"));
            }
        }

        // Fallback: カレントディレクトリのflequitフォルダ
        Ok(PathBuf::from("./flequit"))
    }

    /// 設定済みまたはデフォルトのデータディレクトリを取得
    pub fn get_data_dir(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        if self.config.use_system_default || self.config.data_dir.is_none() {
            Self::get_default_data_dir()
        } else {
            Ok(self.config.data_dir.as_ref().unwrap().clone())
        }
    }

    /// バックアップディレクトリを取得
    pub fn get_backup_dir(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        if let Some(backup_dir) = &self.config.backup_dir {
            Ok(backup_dir.clone())
        } else {
            Ok(self.get_data_dir()?.join("backups"))
        }
    }

    /// エクスポートディレクトリを取得
    pub fn get_export_dir(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        if let Some(export_dir) = &self.config.export_dir {
            Ok(export_dir.clone())
        } else {
            // デフォルトはダウンロードディレクトリ
            if let Some(download_dir) = dirs::download_dir() {
                Ok(download_dir.join("flequit-exports"))
            } else {
                Ok(self.get_data_dir()?.join("exports"))
            }
        }
    }

    /// メインデータファイルのパスを取得
    pub fn get_main_data_file(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        Ok(self.get_data_dir()?.join("tasks.automerge"))
    }

    /// 設定ファイルのパスを取得
    pub fn get_config_file() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        Ok(config_dir.join("flequit").join("path_config.json"))
    }

    /// 必要なディレクトリを作成
    pub fn ensure_directories(&self) -> Result<(), Box<dyn std::error::Error>> {
        let data_dir = self.get_data_dir()?;
        let backup_dir = self.get_backup_dir()?;
        let export_dir = self.get_export_dir()?;

        fs::create_dir_all(&data_dir)?;
        fs::create_dir_all(&backup_dir)?;
        fs::create_dir_all(&export_dir)?;

        log::info!("Created directories:");
        log::info!("  Data: {:?}", data_dir);
        log::info!("  Backup: {:?}", backup_dir);
        log::info!("  Export: {:?}", export_dir);

        Ok(())
    }

    /// 設定をファイルに保存
    pub fn save_config(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_file = Self::get_config_file()?;
        if let Some(parent) = config_file.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(&self.config)?;
        fs::write(&config_file, json)?;
        log::info!("Saved path configuration to: {:?}", config_file);
        Ok(())
    }

    /// 設定をファイルから読み込み
    pub fn load_config() -> Result<PathConfig, Box<dyn std::error::Error>> {
        let config_file = Self::get_config_file()?;
        if config_file.exists() {
            let content = fs::read_to_string(&config_file)?;
            let config: PathConfig = serde_json::from_str(&content)?;
            log::info!("Loaded path configuration from: {:?}", config_file);
            Ok(config)
        } else {
            log::info!("No path configuration found, using defaults");
            Ok(PathConfig::default())
        }
    }

    /// 設定を更新
    pub fn update_config(&mut self, new_config: PathConfig) -> Result<(), Box<dyn std::error::Error>> {
        self.config = new_config;
        self.save_config()?;
        self.ensure_directories()?;
        Ok(())
    }

    /// 現在の設定を取得
    pub fn get_config(&self) -> &PathConfig {
        &self.config
    }

    /// データディレクトリをカスタムパスに設定
    pub fn set_custom_data_dir(&mut self, path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        self.config.data_dir = Some(path);
        self.config.use_system_default = false;
        self.save_config()?;
        self.ensure_directories()?;
        Ok(())
    }

    /// システムデフォルトに戻す
    pub fn reset_to_system_default(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.config.use_system_default = true;
        self.config.data_dir = None;
        self.config.backup_dir = None;
        self.save_config()?;
        self.ensure_directories()?;
        Ok(())
    }

    /// パスの正当性をチェック
    pub fn validate_path(&self, path: &PathBuf) -> Result<bool, Box<dyn std::error::Error>> {
        // パスが存在するか、作成可能かチェック
        if path.exists() {
            // 書き込み権限があるかチェック
            let test_file = path.join(".flequit_write_test");
            match fs::write(&test_file, "test") {
                Ok(_) => {
                    let _ = fs::remove_file(&test_file);
                    Ok(true)
                }
                Err(_) => Ok(false),
            }
        } else {
            // ディレクトリを作成できるかチェック
            match fs::create_dir_all(path) {
                Ok(_) => Ok(true),
                Err(_) => Ok(false),
            }
        }
    }
}