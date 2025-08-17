//! Settings用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{Settings, ViewItem, CustomDateFormat, TimeLabel, DueDateButtons};
use crate::models::sqlite::settings::{Entity as SettingsEntity, Column};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::repositories::settings_repository_trait::{SettingsRepository, SettingsValidator, SettingsValidationError};
use async_trait::async_trait;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryOrder};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Settings用SQLiteリポジトリ
#[derive(Debug)]
pub struct SettingsLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SettingsLocalSqliteRepository {
    /// 新しいインスタンスを作成
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 設定データの部分更新を内部的に処理
    async fn update_partial<F>(&self, updater: F) -> Result<(), RepositoryError>
    where
        F: FnOnce(&mut Settings),
    {
        let mut current_settings = self.load().await?;
        updater(&mut current_settings);
        self.save_with_validation(&current_settings).await
    }
}

#[async_trait]
impl SettingsRepository for SettingsLocalSqliteRepository {
    async fn load(&self) -> Result<Settings, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // 最新の設定レコードを取得（IDの降順で）
        if let Some(model) = SettingsEntity::find()
            .order_by_desc(Column::Id)
            .one(db)
            .await?
        {
            let settings = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(settings)
        } else {
            // 設定が存在しない場合はデフォルト設定を作成して保存
            let default_settings = SettingsValidator::create_default();
            self.save(&default_settings).await?;
            Ok(default_settings)
        }
    }

    async fn save(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let active_model = <Settings as DomainToSqliteConverter<crate::models::sqlite::settings::ActiveModel>>::to_sqlite_model(settings)
            .await
            .map_err(RepositoryError::Conversion)?;
        
        active_model.insert(db).await?;
        Ok(())
    }

    async fn save_with_validation(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let validation_errors = self.validate(settings);
        if !validation_errors.is_empty() {
            let error_messages: Vec<String> = validation_errors
                .iter()
                .map(|e| format!("{}: {}", e.field, e.message))
                .collect();
            return Err(RepositoryError::ValidationError(error_messages.join(", ")));
        }

        self.save(settings).await
    }

    async fn reset_to_default(&self) -> Result<Settings, RepositoryError> {
        let default_settings = SettingsValidator::create_default();
        self.save(&default_settings).await?;
        Ok(default_settings)
    }

    fn validate(&self, settings: &Settings) -> Vec<SettingsValidationError> {
        SettingsValidator::validate(settings)
    }

    async fn update_theme(&self, theme: String) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.theme = theme;
        }).await
    }

    async fn update_language(&self, language: String) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.language = language;
        }).await
    }

    async fn update_custom_date_formats(&self, formats: Vec<CustomDateFormat>) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.custom_date_formats = formats;
        }).await
    }

    async fn update_time_labels(&self, labels: Vec<TimeLabel>) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.time_labels = labels;
        }).await
    }

    async fn update_view_items(&self, items: Vec<ViewItem>) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.view_items = items;
        }).await
    }

    async fn update_due_date_buttons(&self, buttons: DueDateButtons) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.due_date_buttons = buttons;
        }).await
    }

    async fn add_custom_date_format(&self, format: CustomDateFormat) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.custom_date_formats.push(format);
        }).await
    }

    async fn remove_custom_date_format(&self, format_id: &str) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.custom_date_formats.retain(|f| f.id != format_id);
        }).await
    }

    async fn add_time_label(&self, label: TimeLabel) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.time_labels.push(label);
        }).await
    }

    async fn remove_time_label(&self, label_id: &str) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.time_labels.retain(|l| l.id != label_id);
        }).await
    }

    async fn add_view_item(&self, item: ViewItem) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.view_items.push(item);
        }).await
    }

    async fn remove_view_item(&self, item_id: &str) -> Result<(), RepositoryError> {
        self.update_partial(|settings| {
            settings.view_items.retain(|i| i.id != item_id);
        }).await
    }
}
