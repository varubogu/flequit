//! Infrastructure設定管理
//!
//! flequit-infrastructureクレートで使用される設定構造体を定義する。
//! 外部クレートから設定値をセットして関数の引数として渡される想定。

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;

/// Infrastructure層の統合設定
///
/// SQLiteとAutomergeの各機能の有効/無効を制御する。
/// 外部クレートから設定値をセットして関数の引数として渡される。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct InfrastructureConfig {
    /// SQLite検索機能の有効/無効
    pub sqlite_search_enabled: bool,

    /// SQLiteストレージ機能の有効/無効
    pub sqlite_storage_enabled: bool,

    /// Automergeストレージ機能の有効/無効
    pub automerge_storage_enabled: bool,
}

impl InfrastructureConfig {
    /// 新しい設定インスタンスを作成
    ///
    /// # Arguments
    /// * `sqlite_search_enabled` - SQLite検索機能の有効/無効
    /// * `sqlite_storage_enabled` - SQLiteストレージ機能の有効/無効
    /// * `automerge_storage_enabled` - Automergeストレージ機能の有効/無効
    pub fn new(
        sqlite_search_enabled: bool,
        sqlite_storage_enabled: bool,
        automerge_storage_enabled: bool,
    ) -> Self {
        Self {
            sqlite_search_enabled,
            sqlite_storage_enabled,
            automerge_storage_enabled,
        }
    }

    /// 設定値の検証
    ///
    /// 最低限1つのストレージ機能が有効になっていることを確認する。
    ///
    /// # Returns
    /// * `Ok(())` - 設定が有効な場合
    /// * `Err(String)` - 設定が無効な場合（エラーメッセージ）
    pub fn validate(&self) -> Result<(), String> {
        if !self.sqlite_storage_enabled && !self.automerge_storage_enabled {
            return Err(
                "少なくとも1つのストレージ機能（SQLiteまたはAutomerge）を有効にする必要があります"
                    .to_string(),
            );
        }

        if self.sqlite_search_enabled && !self.sqlite_storage_enabled {
            return Err(
                "SQLite検索機能を使用する場合は、SQLiteストレージ機能も有効にする必要があります"
                    .to_string(),
            );
        }

        Ok(())
    }

    /// デフォルト設定ファイルのパスを取得
    ///
    /// ユーザーのホームディレクトリ配下の`.flequit`フォルダに設定ファイルを配置する。
    pub fn default_config_path() -> PathBuf {
        if let Some(home_dir) = dirs::home_dir() {
            home_dir.join(".flequit").join("infrastructure_config.json")
        } else {
            // ホームディレクトリが取得できない場合は現在のディレクトリを使用
            Path::new(".").join("infrastructure_config.json")
        }
    }

    /// 設定ファイルから設定を読み込む
    ///
    /// # Arguments
    /// * `config_path` - 設定ファイルのパス（Noneの場合はデフォルトパスを使用）
    ///
    /// # Returns
    /// * `Ok(InfrastructureConfig)` - 読み込み成功
    /// * `Err(String)` - 読み込み失敗
    pub async fn load(config_path: Option<PathBuf>) -> Result<Self, String> {
        let path = config_path.unwrap_or_else(Self::default_config_path);

        if !path.exists() {
            return Err(format!("設定ファイルが見つかりません: {}", path.display()));
        }

        let content = fs::read_to_string(&path)
            .await
            .map_err(|e| format!("設定ファイルの読み込みに失敗しました: {}", e))?;

        let config: Self = serde_json::from_str(&content)
            .map_err(|e| format!("設定ファイルの解析に失敗しました: {}", e))?;

        config.validate()?;
        Ok(config)
    }

    /// 設定ファイルから読み込むか、存在しない場合はデフォルト値を返す
    ///
    /// # Arguments
    /// * `config_path` - 設定ファイルのパス（Noneの場合はデフォルトパスを使用）
    ///
    /// # Returns
    /// * `Ok(InfrastructureConfig)` - 読み込み成功またはデフォルト値
    /// * `Err(String)` - 読み込み失敗
    pub async fn load_or_default(config_path: Option<PathBuf>) -> Result<Self, String> {
        let path = config_path.unwrap_or_else(Self::default_config_path);

        if path.exists() {
            Self::load(Some(path)).await
        } else {
            tracing::info!(
                "設定ファイルが存在しないため、デフォルト設定を使用します: {}",
                path.display()
            );
            Ok(Self::default())
        }
    }

    /// デフォルト設定ファイルを作成
    ///
    /// # Arguments
    /// * `config_path` - 設定ファイルのパス（Noneの場合はデフォルトパスを使用）
    ///
    /// # Returns
    /// * `Ok(InfrastructureConfig)` - 作成された設定
    /// * `Err(String)` - 作成失敗
    pub async fn create_default_config_file(config_path: Option<PathBuf>) -> Result<Self, String> {
        let path = config_path.unwrap_or_else(Self::default_config_path);
        let config = Self::default();

        // 親ディレクトリを作成
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("設定ディレクトリの作成に失敗しました: {}", e))?;
        }

        // 設定ファイルを書き込み
        let content = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("設定のシリアライズに失敗しました: {}", e))?;

        fs::write(&path, content)
            .await
            .map_err(|e| format!("設定ファイルの書き込みに失敗しました: {}", e))?;

        tracing::info!("デフォルト設定ファイルを作成しました: {}", path.display());
        Ok(config)
    }
}

impl Default for InfrastructureConfig {
    fn default() -> Self {
        Self {
            sqlite_search_enabled: true,
            sqlite_storage_enabled: true,
            automerge_storage_enabled: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_infrastructure_config_creation() {
        let config = InfrastructureConfig::new(true, true, false);
        assert!(config.sqlite_search_enabled);
        assert!(config.sqlite_storage_enabled);
        assert!(!config.automerge_storage_enabled);
    }

    #[test]
    fn test_infrastructure_config_default() {
        let config = InfrastructureConfig::default();
        assert!(config.sqlite_search_enabled);
        assert!(config.sqlite_storage_enabled);
        assert!(config.automerge_storage_enabled);
    }

    #[test]
    fn test_config_validation_success() {
        let config = InfrastructureConfig::new(true, true, false);
        assert!(config.validate().is_ok());

        let config2 = InfrastructureConfig::new(false, false, true);
        assert!(config2.validate().is_ok());
    }

    #[test]
    fn test_config_validation_failure_no_storage() {
        let config = InfrastructureConfig::new(false, false, false);
        let result = config.validate();
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .contains("少なくとも1つのストレージ機能")
        );
    }

    #[test]
    fn test_config_validation_failure_search_without_storage() {
        let config = InfrastructureConfig::new(true, false, true);
        let result = config.validate();
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .contains("SQLite検索機能を使用する場合は")
        );
    }

    #[test]
    fn test_default_config_path() {
        let path = InfrastructureConfig::default_config_path();
        assert!(
            path.to_string_lossy()
                .contains("infrastructure_config.json")
        );
    }

    #[tokio::test]
    async fn test_create_default_config_file() {
        let temp_dir = std::env::temp_dir();
        let config_path = temp_dir.join("test_infrastructure_config.json");

        // テスト用の設定ファイルを作成
        let config = InfrastructureConfig::create_default_config_file(Some(config_path.clone()))
            .await
            .expect("設定ファイルの作成に失敗");

        // 作成されたファイルが存在することを確認
        assert!(config_path.exists());

        // 作成された設定がデフォルト値であることを確認
        assert_eq!(config, InfrastructureConfig::default());

        // テスト用ファイルを削除
        let _ = fs::remove_file(&config_path).await;
    }

    #[tokio::test]
    async fn test_load_config_file() {
        let temp_dir = std::env::temp_dir();
        let config_path = temp_dir.join("test_load_infrastructure_config.json");

        // テスト用の設定ファイルを作成
        let original_config = InfrastructureConfig::new(true, false, true);
        let content = serde_json::to_string_pretty(&original_config).unwrap();
        fs::write(&config_path, content).await.unwrap();

        // 設定ファイルを読み込み
        let loaded_config = InfrastructureConfig::load(Some(config_path.clone()))
            .await
            .expect("設定ファイルの読み込みに失敗");

        // 読み込まれた設定が元の設定と一致することを確認
        assert_eq!(loaded_config, original_config);

        // テスト用ファイルを削除
        let _ = fs::remove_file(&config_path).await;
    }

    #[tokio::test]
    async fn test_load_or_default_with_existing_file() {
        let temp_dir = std::env::temp_dir();
        let config_path = temp_dir.join("test_load_or_default_existing.json");

        // テスト用の設定ファイルを作成
        let original_config = InfrastructureConfig::new(false, true, false);
        let content = serde_json::to_string_pretty(&original_config).unwrap();
        fs::write(&config_path, content).await.unwrap();

        // 設定ファイルを読み込み
        let loaded_config = InfrastructureConfig::load_or_default(Some(config_path.clone()))
            .await
            .expect("設定ファイルの読み込みに失敗");

        // 読み込まれた設定が元の設定と一致することを確認
        assert_eq!(loaded_config, original_config);

        // テスト用ファイルを削除
        let _ = fs::remove_file(&config_path).await;
    }

    #[tokio::test]
    async fn test_load_or_default_without_file() {
        let temp_dir = std::env::temp_dir();
        let config_path = temp_dir.join("non_existent_config.json");

        // 存在しないファイルを指定してload_or_defaultを呼び出し
        let config = InfrastructureConfig::load_or_default(Some(config_path))
            .await
            .expect("デフォルト設定の取得に失敗");

        // デフォルト設定が返されることを確認
        assert_eq!(config, InfrastructureConfig::default());
    }
}
