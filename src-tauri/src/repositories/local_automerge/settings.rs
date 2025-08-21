//! Settings用Automergeリポジトリ

use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{CustomDateFormat, TimeLabel, ViewItem, Settings};
use crate::repositories::setting_repository_trait::SettingRepositoryTrait;
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

const SETTINGS_KEY: &str = "app_settings";
const CUSTOM_DATE_FORMATS_KEY: &str = "custom_date_formats";
const TIME_LABELS_KEY: &str = "time_labels";
const VIEW_ITEMS_KEY: &str = "view_items";

/// Settings用のAutomerge-Repoリポジトリ
#[derive(Debug, Clone)]
pub struct SettingsLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SettingsLocalAutomergeRepository {
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }
}

#[async_trait]
impl SettingRepositoryTrait for SettingsLocalAutomergeRepository {
    // ---------------------------
    // 設定（構造体）
    // ---------------------------

    async fn get_settings(&self) -> Result<Option<Settings>, RepositoryError> {
        let settings = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Settings>(&DocumentType::Settings, SETTINGS_KEY)
                .await?
        };

        Ok(settings)
    }

    async fn save_settings(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, SETTINGS_KEY, settings)
            .await
    }

    // ---------------------------
    // Custom Date Formats
    // ---------------------------

    async fn get_custom_date_format(
        &self,
        id: &str,
    ) -> Result<Option<CustomDateFormat>, RepositoryError> {
        let formats = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<CustomDateFormat>>(
                    &DocumentType::Settings,
                    CUSTOM_DATE_FORMATS_KEY,
                )
                .await?
        };

        if let Some(formats) = formats {
            Ok(formats.into_iter().find(|f| f.id == id))
        } else {
            Ok(None)
        }
    }

    async fn get_all_custom_date_formats(&self) -> Result<Vec<CustomDateFormat>, RepositoryError> {
        let formats = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<CustomDateFormat>>(
                    &DocumentType::Settings,
                    CUSTOM_DATE_FORMATS_KEY,
                )
                .await?
        };

        Ok(formats.unwrap_or_default())
    }

    async fn add_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        let mut formats = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<CustomDateFormat>>(
                    &DocumentType::Settings,
                    CUSTOM_DATE_FORMATS_KEY,
                )
                .await?
        }
        .unwrap_or_default();

        formats.push(format.clone());

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, CUSTOM_DATE_FORMATS_KEY, &formats)
            .await
    }

    async fn update_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        let mut formats = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<CustomDateFormat>>(
                    &DocumentType::Settings,
                    CUSTOM_DATE_FORMATS_KEY,
                )
                .await?
        }
        .unwrap_or_default();

        if let Some(existing) = formats.iter_mut().find(|f| f.id == format.id) {
            *existing = format.clone();
        } else {
            return Err(RepositoryError::NotFound(format!(
                "CustomDateFormat not found: {}",
                format.id
            )));
        }

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, CUSTOM_DATE_FORMATS_KEY, &formats)
            .await
    }

    async fn delete_custom_date_format(&self, id: &str) -> Result<(), RepositoryError> {
        let mut formats = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<CustomDateFormat>>(
                    &DocumentType::Settings,
                    CUSTOM_DATE_FORMATS_KEY,
                )
                .await?
        }
        .unwrap_or_default();

        let initial_len = formats.len();
        formats.retain(|f| f.id != id);

        if formats.len() == initial_len {
            return Err(RepositoryError::NotFound(format!(
                "CustomDateFormat not found: {}",
                id
            )));
        }

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, CUSTOM_DATE_FORMATS_KEY, &formats)
            .await
    }

    // ---------------------------
    // Time Labels
    // ---------------------------

    async fn get_time_label(&self, id: &str) -> Result<Option<TimeLabel>, RepositoryError> {
        let labels = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<TimeLabel>>(&DocumentType::Settings, TIME_LABELS_KEY)
                .await?
        };

        if let Some(labels) = labels {
            Ok(labels.into_iter().find(|l| l.id == id))
        } else {
            Ok(None)
        }
    }

    async fn get_all_time_labels(&self) -> Result<Vec<TimeLabel>, RepositoryError> {
        let labels = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<TimeLabel>>(&DocumentType::Settings, TIME_LABELS_KEY)
                .await?
        };

        Ok(labels.unwrap_or_default())
    }

    async fn add_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        let mut labels = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<TimeLabel>>(&DocumentType::Settings, TIME_LABELS_KEY)
                .await?
        }
        .unwrap_or_default();

        labels.push(label.clone());

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, TIME_LABELS_KEY, &labels)
            .await
    }

    async fn update_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        let mut labels = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<TimeLabel>>(&DocumentType::Settings, TIME_LABELS_KEY)
                .await?
        }
        .unwrap_or_default();

        if let Some(existing) = labels.iter_mut().find(|l| l.id == label.id) {
            *existing = label.clone();
        } else {
            return Err(RepositoryError::NotFound(format!(
                "TimeLabel not found: {}",
                label.id
            )));
        }

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, TIME_LABELS_KEY, &labels)
            .await
    }

    async fn delete_time_label(&self, id: &str) -> Result<(), RepositoryError> {
        let mut labels = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<TimeLabel>>(&DocumentType::Settings, TIME_LABELS_KEY)
                .await?
        }
        .unwrap_or_default();

        let initial_len = labels.len();
        labels.retain(|l| l.id != id);

        if labels.len() == initial_len {
            return Err(RepositoryError::NotFound(format!(
                "TimeLabel not found: {}",
                id
            )));
        }

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, TIME_LABELS_KEY, &labels)
            .await
    }

    // ---------------------------
    // View Items
    // ---------------------------

    async fn get_view_item(&self, id: &str) -> Result<Option<ViewItem>, RepositoryError> {
        let items = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<ViewItem>>(&DocumentType::Settings, VIEW_ITEMS_KEY)
                .await?
        };

        if let Some(items) = items {
            Ok(items.into_iter().find(|i| i.id == id))
        } else {
            Ok(None)
        }
    }

    async fn get_all_view_items(&self) -> Result<Vec<ViewItem>, RepositoryError> {
        let items = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<ViewItem>>(&DocumentType::Settings, VIEW_ITEMS_KEY)
                .await?
        };

        Ok(items.unwrap_or_default())
    }

    async fn add_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        let mut items = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<ViewItem>>(&DocumentType::Settings, VIEW_ITEMS_KEY)
                .await?
        }
        .unwrap_or_default();

        items.push(item.clone());

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, VIEW_ITEMS_KEY, &items)
            .await
    }

    async fn update_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        let mut items = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<ViewItem>>(&DocumentType::Settings, VIEW_ITEMS_KEY)
                .await?
        }
        .unwrap_or_default();

        if let Some(existing) = items.iter_mut().find(|i| i.id == item.id) {
            *existing = item.clone();
        } else {
            return Err(RepositoryError::NotFound(format!(
                "ViewItem not found: {}",
                item.id
            )));
        }

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, VIEW_ITEMS_KEY, &items)
            .await
    }

    async fn delete_view_item(&self, id: &str) -> Result<(), RepositoryError> {
        let mut items = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<ViewItem>>(&DocumentType::Settings, VIEW_ITEMS_KEY)
                .await?
        }
        .unwrap_or_default();

        let initial_len = items.len();
        items.retain(|i| i.id != id);

        if items.len() == initial_len {
            return Err(RepositoryError::NotFound(format!(
                "ViewItem not found: {}",
                id
            )));
        }

        let mut manager = self.document_manager.lock().await;
        manager
            .save_data(&DocumentType::Settings, VIEW_ITEMS_KEY, &items)
            .await
    }
}
