use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use flequit_model::models::ModelConverter;
use flequit_model::models::app_settings::datetime_format::DateTimeFormat;
use crate::models::CommandModelConverter;

/// 日時フォーマットコマンド
#[derive(Debug, Clone, Serialize, Deserialize)]
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
        Ok(DateTimeFormat {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
            group: todo!(),
            order: self.order.clone()
        })
    }
}

#[async_trait]
impl CommandModelConverter<DateTimeFormatCommandModel> for DateTimeFormat {
    /// ドメインモデル（CustomDateFormat）からコマンドモデル（CustomDateFormatCommand）に変換
    async fn to_command_model(&self) -> Result<DateTimeFormatCommandModel, String> {
        Ok(DateTimeFormatCommandModel {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
            group: todo!(),
            order: self.order.clone()
        })
    }
}
