//! Settings用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::setting::{CustomDateFormat, TimeLabel, ViewItem};
use crate::models::sqlite::settings_key_value::{
    ActiveModel as SettingKeyValueActiveModel, Column as SettingKeyValueColumn,
    Entity as SettingKeyValueEntity,
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
    // Key-Value設定
    // ---------------------------

    async fn get_setting(&self, key: &str) -> Result<Option<String>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let model = SettingKeyValueEntity::find_by_id(key).one(db).await?;
        Ok(model.map(|m| m.value))
    }

    async fn set_setting(&self, key: &str, value: &str) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let model = SettingKeyValueActiveModel {
            key: ActiveValue::Set(key.to_string()),
            value: ActiveValue::Set(value.to_string()),
        };
        // `insert` はPK違反で失敗する可能性があるため、`save` (UPSERT) を使うのが望ましいが、
        // sea-ormのSQLiteバックエンドでは `save` が素直なUPSERTにならないケースがある。
        // ここでは、まず存在確認してからUPDATE/INSERTする。
        if SettingKeyValueEntity::find_by_id(key)
            .one(db)
            .await?
            .is_some()
        {
            // UPDATE
            SettingKeyValueEntity::update(model)
                .filter(SettingKeyValueColumn::Key.eq(key))
                .exec(db)
                .await?;
        } else {
            // INSERT
            model.insert(db).await?;
        }
        Ok(())
    }

    async fn get_all_key_value_settings(&self) -> Result<HashMap<String, String>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SettingKeyValueEntity::find().all(db).await?;
        let map = models.into_iter().map(|m| (m.key, m.value)).collect();
        Ok(map)
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
