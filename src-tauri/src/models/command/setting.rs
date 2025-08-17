use serde::{Deserialize, Serialize};

use crate::models::command::ModelConverter;
use crate::models::setting::{
    CustomDateFormat, DueDateButtons, LocalSettings, Setting, Settings, TimeLabel, ViewItem,
};

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

/// Tauriコマンド引数用のSettings構造体（フラット構造）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsCommand {
    // テーマ・外観設定
    pub theme: String,
    pub language: String,
    pub font: String,
    pub font_size: i32,
    pub font_color: String,
    pub background_color: String,

    // 基本設定
    pub week_start: String,
    pub timezone: String,
    pub date_format: String,
    pub custom_due_days: Vec<i32>,
    pub custom_date_formats: Vec<CustomDateFormat>,
    pub time_labels: Vec<TimeLabel>,

    // 表示設定
    pub due_date_buttons: DueDateButtons,
    pub view_items: Vec<ViewItem>,

    // アカウント設定
    pub selected_account: String,
    pub account_icon: Option<String>,
    pub account_name: String,
    pub email: String,
    pub password: String,
    pub server_url: String,
}

impl ModelConverter<Settings> for SettingsCommand {
    /// コマンド引数用（SettingsCommand）から内部モデル（Settings）に変換
    async fn to_model(&self) -> Result<Settings, String> {
        Ok(crate::models::setting::Settings {
            theme: self.theme.clone(),
            language: self.language.clone(),
            font: self.font.clone(),
            font_size: self.font_size,
            font_color: self.font_color.clone(),
            background_color: self.background_color.clone(),
            week_start: self.week_start.clone(),
            timezone: self.timezone.clone(),
            date_format: self.date_format.clone(),
            custom_due_days: self.custom_due_days.clone(),
            custom_date_formats: self.custom_date_formats.clone(),
            time_labels: self.time_labels.clone(),
            due_date_buttons: self.due_date_buttons.clone(),
            view_items: self.view_items.clone(),
            selected_account: self.selected_account.clone(),
            account_icon: self.account_icon.clone(),
            account_name: self.account_name.clone(),
            email: self.email.clone(),
            password: self.password.clone(),
            server_url: self.server_url.clone(),
        })
    }
}
