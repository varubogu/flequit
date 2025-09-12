use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::models::CommandModelConverter;
use flequit_model::models::ModelConverter;
use flequit_settings::models::view_item::ViewItem;

/// Tauriコマンド引数用のViewItem構造体
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ViewItemCommandModel {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub visible: bool,
    pub order: i32,
}

#[async_trait]
impl ModelConverter<ViewItem> for ViewItemCommandModel {
    /// コマンド引数用（ViewItemCommand）から内部モデル（ViewItem）に変換
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
impl CommandModelConverter<ViewItemCommandModel> for ViewItem {
    /// ドメインモデル（ViewItem）からコマンドモデル（ViewItemCommand）に変換
    async fn to_command_model(&self) -> Result<ViewItemCommandModel, String> {
        Ok(ViewItemCommandModel {
            id: self.id.clone(),
            label: self.label.clone(),
            icon: self.icon.clone(),
            visible: self.visible,
            order: self.order,
        })
    }
}
