use serde::{Serialize, Deserialize};

use crate::models::setting::{LocalSettings, Setting};
use crate::models::command::ModelConverter;

/// Tauriコマンド引数用のLocalSettings構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalSettingsCommand {
    pub theme: String,
    pub language: String,
}

impl ModelConverter<LocalSettings> for LocalSettingsCommand {
    /// コマンド引数用（LocalSettingsCommand）から内部モデル（LocalSettings）に変換
    async fn to_model(&self) -> Result<LocalSettings, String> {
        Ok(crate::models::setting::LocalSettings {
            theme: self.theme.clone(),
            language: self.language.clone(),
        })
    }
}

/// Tauriコマンド引数用のSetting構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingCommand {
    pub id: String,
    pub key: String,
    pub value: String,
    pub data_type: String,
    pub created_at: String,
    pub updated_at: String,
}

impl ModelConverter<Setting> for SettingCommand {
    /// コマンド引数用（SettingCommand）から内部モデル（Setting）に変換
    async fn to_model(&self) -> Result<Setting, String> {
        Ok(crate::models::setting::Setting {
            id: self.id.clone(),
            key: self.key.clone(),
            value: self.value.clone(),
            data_type: self.data_type.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
        })
    }
}