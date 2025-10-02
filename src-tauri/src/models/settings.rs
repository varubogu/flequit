use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::ModelConverter;
use flequit_settings::models::datetime_format::DateTimeFormat;
use flequit_settings::models::due_date_buttons::DueDateButtons;
use flequit_settings::models::settings::{PartialSettings, Settings};
use flequit_settings::models::time_label::TimeLabel;
use flequit_settings::models::view_item::ViewItem;
use flequit_settings::types::datetime_format_types::DateTimeFormatGroup;

/// Tauriコマンド引数用のSettings構造体（フラット構造）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsCommandModel {
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
    pub datetime_format: String,
    pub custom_due_days: Vec<i32>,
    pub datetime_formats: Vec<DateTimeFormat>,
    pub time_labels: Vec<TimeLabel>,

    // 表示設定
    pub due_date_buttons: Vec<DueDateButtons>,
    pub view_items: Vec<ViewItem>,
}

#[async_trait]
impl ModelConverter<Settings> for SettingsCommandModel {
    /// コマンド引数用（SettingsCommand）から内部モデル（Settings）に変換
    async fn to_model(&self) -> Result<Settings, String> {
        Ok(Settings {
            theme: self.theme.clone(),
            language: self.language.clone(),
            font: self.font.clone(),
            font_size: self.font_size,
            font_color: self.font_color.clone(),
            background_color: self.background_color.clone(),
            week_start: self.week_start.clone(),
            timezone: self.timezone.clone(),
            custom_due_days: self.custom_due_days.clone(),
            datetime_format: DateTimeFormat {
                id: "current".to_string(),
                name: "Current Format".to_string(),
                format: self.datetime_format.clone(),
                group: DateTimeFormatGroup::Preset,
                order: 1,
            },
            datetime_formats: self.datetime_formats.clone(),
            time_labels: self.time_labels.clone(),
            due_date_buttons: self.due_date_buttons.clone(),
            view_items: self.view_items.clone(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<SettingsCommandModel> for Settings {
    /// ドメインモデル（Settings）からコマンドモデル（SettingsCommand）に変換
    async fn to_command_model(&self) -> Result<SettingsCommandModel, String> {
        Ok(SettingsCommandModel {
            theme: self.theme.clone(),
            language: self.language.clone(),
            font: self.font.clone(),
            font_size: self.font_size,
            font_color: self.font_color.clone(),
            background_color: self.background_color.clone(),
            week_start: self.week_start.clone(),
            timezone: self.timezone.clone(),
            datetime_format: self.datetime_format.format.clone(),
            datetime_formats: self.datetime_formats.clone(),
            custom_due_days: self.custom_due_days.clone(),
            time_labels: self.time_labels.clone(),
            due_date_buttons: self.due_date_buttons.clone(),
            view_items: self.view_items.clone(),
        })
    }
}

/// Tauriコマンド引数用のPartialSettings構造体（部分更新用）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PartialSettingsCommandModel {
    // テーマ・外観設定
    pub theme: Option<String>,
    pub language: Option<String>,
    pub font: Option<String>,
    pub font_size: Option<i32>,
    pub font_color: Option<String>,
    pub background_color: Option<String>,

    // 基本設定
    pub week_start: Option<String>,
    pub timezone: Option<String>,
    pub datetime_format: Option<String>,
    pub custom_due_days: Option<Vec<i32>>,
    pub datetime_formats: Option<Vec<DateTimeFormat>>,
    pub time_labels: Option<Vec<TimeLabel>>,

    // 表示設定
    pub due_date_buttons: Option<Vec<DueDateButtons>>,
    pub view_items: Option<Vec<ViewItem>>,
}

#[async_trait]
impl ModelConverter<PartialSettings> for PartialSettingsCommandModel {
    /// コマンド引数用（PartialSettingsCommand）から内部モデル（PartialSettings）に変換
    async fn to_model(&self) -> Result<PartialSettings, String> {
        Ok(PartialSettings {
            theme: self.theme.clone(),
            language: self.language.clone(),
            font: self.font.clone(),
            font_size: self.font_size,
            font_color: self.font_color.clone(),
            background_color: self.background_color.clone(),
            week_start: self.week_start.clone(),
            timezone: self.timezone.clone(),
            custom_due_days: self.custom_due_days.clone(),
            datetime_format: self.datetime_format.as_ref().map(|f| DateTimeFormat {
                id: "selected".to_string(),
                name: "Selected Format".to_string(),
                format: f.clone(),
                group: DateTimeFormatGroup::Custom,
                order: 0,
            }),
            datetime_formats: self.datetime_formats.clone(),
            time_labels: self.time_labels.clone(),
            due_date_buttons: self.due_date_buttons.clone(),
            view_items: self.view_items.clone(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<PartialSettingsCommandModel> for PartialSettings {
    /// 内部モデル（PartialSettings）からコマンド引数用（PartialSettingsCommand）に変換
    async fn to_command_model(&self) -> Result<PartialSettingsCommandModel, String> {
        Ok(PartialSettingsCommandModel {
            theme: self.theme.clone(),
            language: self.language.clone(),
            font: self.font.clone(),
            font_size: self.font_size,
            font_color: self.font_color.clone(),
            background_color: self.background_color.clone(),
            week_start: self.week_start.clone(),
            timezone: self.timezone.clone(),
            datetime_format: self.datetime_format.as_ref().map(|f| f.format.clone()),
            custom_due_days: self.custom_due_days.clone(),
            datetime_formats: self.datetime_formats.clone(),
            time_labels: self.time_labels.clone(),
            due_date_buttons: self.due_date_buttons.clone(),
            view_items: self.view_items.clone(),
        })
    }
}
