use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::ModelConverter;
use flequit_settings::models::datetime_format::DateTimeFormat;
use flequit_settings::types::datetime_format_types::DateTimeFormatGroup;

/// 日時フォーマットコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DateTimeFormatCommandModel {
    /// フォーマットID
    pub id: String,
    /// フォーマット表示名
    pub name: String,
    /// フォーマット文字列（chrono形式）
    pub format: String,
    /// フォーマットグループ
    pub group: String,
    /// 表示順序
    pub order: i32,
}

#[async_trait]
impl ModelConverter<DateTimeFormat> for DateTimeFormatCommandModel {
    /// コマンド引数用（CustomDateFormatCommand）から内部モデル（CustomDateFormat）に変換
    async fn to_model(&self) -> Result<DateTimeFormat, String> {
        let group = match self.group.to_lowercase().as_str() {
            "default" => DateTimeFormatGroup::Default,
            "preset" => DateTimeFormatGroup::Preset,
            "custom" => DateTimeFormatGroup::Custom,
            "custom_format" | "customformat" => DateTimeFormatGroup::CustomFormat,
            other => return Err(format!("Unknown DateTimeFormat group: {}", other)),
        };

        Ok(DateTimeFormat {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
            group,
            order: self.order.clone(),
        })
    }
}

#[async_trait]
impl CommandModelConverter<DateTimeFormatCommandModel> for DateTimeFormat {
    /// ドメインモデル（CustomDateFormat）からコマンドモデル（CustomDateFormatCommand）に変換
    async fn to_command_model(&self) -> Result<DateTimeFormatCommandModel, String> {
        let group = match self.group.clone() {
            DateTimeFormatGroup::Default => "default".to_string(),
            DateTimeFormatGroup::Preset => "preset".to_string(),
            DateTimeFormatGroup::Custom => "custom".to_string(),
            DateTimeFormatGroup::CustomFormat => "custom_format".to_string(),
        };

        Ok(DateTimeFormatCommandModel {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
            group,
            order: self.order.clone(),
        })
    }
}
