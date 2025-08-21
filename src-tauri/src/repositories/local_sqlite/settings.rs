//! Settings用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{CustomDateFormat, TimeLabel, ViewItem, Settings};
use crate::models::sqlite::setting::{
    ActiveModel as SettingActiveModel, Entity as SettingEntity,
};
use crate::models::sqlite::{
    custom_date_format::{
        ActiveModel as CustomDateFormatActiveModel, Entity as CustomDateFormatEntity,
    },
    time_label::{ActiveModel as TimeLabelActiveModel, Entity as TimeLabelEntity},
    view_item::{ActiveModel as ViewItemActiveModel, Entity as ViewItemEntity},
    DomainToSqliteConverter, SqliteModelConverter,
};
use crate::repositories::setting_repository_trait::SettingRepositoryTrait;
use async_trait::async_trait;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Settings用SQLiteリポジトリ
#[derive(Debug, Clone)]
pub struct SettingsLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SettingsLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }
}

#[async_trait]
impl SettingRepositoryTrait for SettingsLocalSqliteRepository {
    // ---------------------------
    // 設定（構造体）
    // ---------------------------

    async fn get_settings(&self) -> Result<Option<Settings>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // 設定は単一レコードとして保存する（id = "app_settings"）
        let model = SettingEntity::find_by_id("app_settings").one(db).await?;
        
        if let Some(model) = model {
            // SQLiteモデルからドメインモデルに変換
            let settings = model.to_domain_model().await?;
            Ok(Some(settings))
        } else {
            Ok(None)
        }
    }

    async fn save_settings(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        // ドメインモデルからSQLiteモデルに変換
        let active_model: SettingActiveModel = settings.to_sqlite_model().await?;
        
        // 既存レコードがあるかチェックしてUPSERT
        if SettingEntity::find_by_id("app_settings").one(db).await?.is_some() {
            active_model.update(db).await?;
        } else {
            active_model.insert(db).await?;
        }
        
        Ok(())
    }

    // ---------------------------
    // Custom Date Formats
    // ---------------------------

    async fn get_custom_date_format(
        &self,
        id: &str,
    ) -> Result<Option<CustomDateFormat>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = CustomDateFormatEntity::find_by_id(id).one(db).await? {
            Ok(Some(model.to_domain_model().await?))
        } else {
            Ok(None)
        }
    }

    async fn get_all_custom_date_formats(&self) -> Result<Vec<CustomDateFormat>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = CustomDateFormatEntity::find().all(db).await?;
        let mut results = Vec::new();
        for model in models {
            results.push(model.to_domain_model().await?);
        }
        Ok(results)
    }

    async fn add_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let model: CustomDateFormatActiveModel = format.to_sqlite_model().await?;
        model.insert(db).await?;
        Ok(())
    }

    async fn update_custom_date_format(
        &self,
        format: &CustomDateFormat,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let model: CustomDateFormatActiveModel = format.to_sqlite_model().await?;
        model.update(db).await?;
        Ok(())
    }

    async fn delete_custom_date_format(&self, id: &str) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        CustomDateFormatEntity::delete_by_id(id).exec(db).await?;
        Ok(())
    }

    // ---------------------------
    // Time Labels
    // ---------------------------

    async fn get_time_label(&self, id: &str) -> Result<Option<TimeLabel>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        if let Some(model) = TimeLabelEntity::find_by_id(id).one(db).await? {
            Ok(Some(model.to_domain_model().await?))
        } else {
            Ok(None)
        }
    }

    async fn get_all_time_labels(&self) -> Result<Vec<TimeLabel>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let models = TimeLabelEntity::find().all(db).await?;
        let mut results = Vec::new();
        for model in models {
            results.push(model.to_domain_model().await?);
        }
        Ok(results)
    }

    async fn add_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let model: TimeLabelActiveModel = label.to_sqlite_model().await?;
        model.insert(db).await?;
        Ok(())
    }

    async fn update_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let model: TimeLabelActiveModel = label.to_sqlite_model().await?;
        model.update(db).await?;
        Ok(())
    }

    async fn delete_time_label(&self, id: &str) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        TimeLabelEntity::delete_by_id(id).exec(db).await?;
        Ok(())
    }

    // ---------------------------
    // View Items
    // ---------------------------

    async fn get_view_item(&self, id: &str) -> Result<Option<ViewItem>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        if let Some(model) = ViewItemEntity::find_by_id(id).one(db).await? {
            Ok(Some(model.to_domain_model().await?))
        } else {
            Ok(None)
        }
    }

    async fn get_all_view_items(&self) -> Result<Vec<ViewItem>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let models = ViewItemEntity::find().all(db).await?;
        let mut results = Vec::new();
        for model in models {
            results.push(model.to_domain_model().await?);
        }
        Ok(results)
    }

    async fn add_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let model: ViewItemActiveModel = item.to_sqlite_model().await?;
        model.insert(db).await?;
        Ok(())
    }

    async fn update_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let model: ViewItemActiveModel = item.to_sqlite_model().await?;
        model.update(db).await?;
        Ok(())
    }

    async fn delete_view_item(&self, id: &str) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        ViewItemEntity::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}
