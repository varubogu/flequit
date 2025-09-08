use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use flequit_model::models::ModelConverter;
use flequit_model::models::app_settings::datetime_format::DateTimeFormat;
use crate::models::CommandModelConverter;

/// Tauriコマンド引数用のCustomDateFormat構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CustomDateFormatCommandModel {
    pub id: String,
    pub name: String,
    pub format: String,
}

#[async_trait]
impl ModelConverter<DateTimeFormat> for CustomDateFormatCommandModel {
    /// コマンド引数用（CustomDateFormatCommand）から内部モデル（CustomDateFormat）に変換
    async fn to_model(&self) -> Result<DateTimeFormat, String> {
        Ok(DateTimeFormat {
            id: __self.id.clone(),
            name: __self.name.clone(),
            format: __self.format.clone(),
            group: todo!(),
            order: todo!()
        })
    }
}

#[async_trait]
impl CommandModelConverter<CustomDateFormatCommandModel> for DateTimeFormat {
    /// ドメインモデル（CustomDateFormat）からコマンドモデル（CustomDateFormatCommand）に変換
    async fn to_command_model(&self) -> Result<CustomDateFormatCommandModel, String> {
        Ok(CustomDateFormatCommandModel {
            id: self.id.clone(),
            name: self.name.clone(),
            format: self.format.clone(),
        })
    }
}
