//! Infrastructure設定管理
//!
//! flequit-infrastructureクレートで使用される設定構造体を定義する。
//! 外部クレートから設定値をセットして関数の引数として渡される想定。

use serde::{Deserialize, Serialize};

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
}

impl Default for InfrastructureConfig {
    /// デフォルト設定
    ///
    /// SQLite検索無効、SQLiteストレージ有効、Automergeストレージ有効
    fn default() -> Self {
        Self {
            sqlite_search_enabled: false,
            sqlite_storage_enabled: true,
            automerge_storage_enabled: true,
        }
    }
}

// UnifiedConfigはInfrastructureConfigのエイリアス（後方互換性のため）
pub type UnifiedConfig = InfrastructureConfig;

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
        assert!(!config.sqlite_search_enabled);
        assert!(config.sqlite_storage_enabled);
        assert!(config.automerge_storage_enabled);
    }

    #[test]
    fn test_config_validation_success() {
        let config = InfrastructureConfig::new(false, true, true);
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_config_validation_failure_no_storage() {
        let config = InfrastructureConfig::new(false, false, false);
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_validation_failure_search_without_storage() {
        let config = InfrastructureConfig::new(true, false, true);
        assert!(config.validate().is_err());
    }
}
