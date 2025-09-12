use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::ModelConverter;
use flequit_settings::models::time_label::TimeLabel;

/// Tauriコマンド引数用のTimeLabel構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct TimeLabelCommandModel {
    pub id: String,
    pub name: String,
    pub time: String,
    pub color: String,
    pub order: i32,
}

#[async_trait]
impl ModelConverter<TimeLabel> for TimeLabelCommandModel {
    /// コマンド引数用（TimeLabelCommand）から内部モデル（TimeLabel）に変換
    async fn to_model(&self) -> Result<TimeLabel, String> {
        Ok(TimeLabel {
            id: self.id.clone(),
            name: self.name.clone(),
            time: self.time.clone(),
            color: self.color.clone(),
            order: self.order,
        })
    }
}

#[async_trait]
impl CommandModelConverter<TimeLabelCommandModel> for TimeLabel {
    /// ドメインモデル（TimeLabel）からコマンドモデル（TimeLabelCommand）に変換
    async fn to_command_model(&self) -> Result<TimeLabelCommandModel, String> {
        Ok(TimeLabelCommandModel {
            id: self.id.clone(),
            name: self.name.clone(),
            time: self.time.clone(),
            color: self.color.clone(),
            order: self.order,
        })
    }
}
