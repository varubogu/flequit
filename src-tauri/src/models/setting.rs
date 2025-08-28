use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use flequit_model::models::ModelConverter;
use flequit_model::models::setting::{
    CustomDateFormat, DueDateButtons, LocalSettings, Setting, Settings, TimeLabel, ViewItem,
};
use crate::models::CommandModelConverter;
use flequit_model::types::id_types::SettingsId;

/// Tauriコマンド引数用のLocalSettings構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalSettingsCommand {
    pub theme: String,
    pub language: String,
}

#[async_trait]
impl ModelConverter<LocalSettings> for LocalSettingsCommand {
    /// コマンド引数用（LocalSettingsCommand）から内部モデル（LocalSettings）に変換
    async fn to_model(&self) -> Result<LocalSettings, String> {
        Ok(LocalSettings {
            theme: self.theme.clone(),
            language: self.language.clone(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<LocalSettingsCommand> for LocalSettings {
    /// ドメインモデル（LocalSettings）からコマンドモデル（LocalSettingsCommand）に変換
    async fn to_command_model(&self) -> Result<LocalSettingsCommand, String> {
        Ok(LocalSettingsCommand {
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

#[async_trait]
impl ModelConverter<Setting> for SettingCommand {
    /// コマンド引数用（SettingCommand）から内部モデル（Setting）に変換
    async fn to_model(&self) -> Result<Setting, String> {
        Ok(Setting {
            id: self.id.clone(),
            key: self.key.clone(),
            value: self.value.clone(),
            data_type: self.data_type.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<SettingCommand> for Setting {
    /// ドメインモデル（Setting）からコマンドモデル（SettingCommand）に変換
    async fn to_command_model(&self) -> Result<SettingCommand, String> {
        Ok(SettingCommand {
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
    pub last_selected_account: String,
}

#[async_trait]
impl ModelConverter<Settings> for SettingsCommand {
    /// コマンド引数用（SettingsCommand）から内部モデル（Settings）に変換
    async fn to_model(&self) -> Result<Settings, String> {
        Ok(Settings {
            id: SettingsId::from("app_settings"),
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
            last_selected_account: self.last_selected_account.clone(),
        })
    }
}

/// Tauriコマンド引数用のCustomDateFormat構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomDateFormatCommand {
    pub id: String,
    pub name: String,
    pub format: String,
}

#[async_trait]
impl ModelConverter<CustomDateFormat> for CustomDateFormatCommand {
    async fn to_model(&self) -> Result<CustomDateFormat, String> {
        Ok(CustomDateFormat {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<CustomDateFormatCommand> for CustomDateFormat {
    async fn to_command_model(&self) -> Result<CustomDateFormatCommand, String> {
        Ok(CustomDateFormatCommand {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
        })
    }
}

/// Tauriコマンド引数用のTimeLabel構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeLabelCommand {
    pub id: String,
    pub name: String,
    pub time: String,
}

#[async_trait]
impl ModelConverter<TimeLabel> for TimeLabelCommand {
    async fn to_model(&self) -> Result<TimeLabel, String> {
        Ok(TimeLabel {
            id: self.id.clone(),
            name: self.name.clone(),
            time: self.time.clone(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<TimeLabelCommand> for TimeLabel {
    async fn to_command_model(&self) -> Result<TimeLabelCommand, String> {
        Ok(TimeLabelCommand {
            id: self.id.clone(),
            name: self.name.clone(),
            time: self.time.clone(),
        })
    }
}

/// Tauriコマンド引数用のViewItem構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewItemCommand {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub visible: bool,
    pub order: i32,
}

#[async_trait]
impl ModelConverter<ViewItem> for ViewItemCommand {
    async fn to_model(&self) -> Result<ViewItem, String> {
        Ok(ViewItem {
            id: self.id.clone(),
            label: self.label.clone(),
            icon: self.icon.clone(),
            visible: self.visible,
            order: self.order,
        })
    }
}

#[async_trait]
impl CommandModelConverter<ViewItemCommand> for ViewItem {
    async fn to_command_model(&self) -> Result<ViewItemCommand, String> {
        Ok(ViewItemCommand {
            id: self.id.clone(),
            label: self.label.clone(),
            icon: self.icon.clone(),
            visible: self.visible,
            order: self.order,
        })
    }
}

#[async_trait]
impl CommandModelConverter<SettingsCommand> for Settings {
    async fn to_command_model(&self) -> Result<SettingsCommand, String> {
        Ok(SettingsCommand {
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
            last_selected_account: self.last_selected_account.clone(),
        })
    }
}
