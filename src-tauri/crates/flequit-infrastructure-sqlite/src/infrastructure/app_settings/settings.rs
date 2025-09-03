//! Settings用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use flequit_model::models::app_settings::settings::Settings;
use flequit_types::errors::repository_error::RepositoryError;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::settings::{ActiveModel as SettingActiveModel, Entity as SettingEntity};
use crate::models::{
    DomainToSqliteConverter, SqliteModelConverter,
};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::app_settings::settings_repository_trait::SettingsRepositoryTrait;
use flequit_model::types::id_types::SettingsId;
use async_trait::async_trait;
use sea_orm::{ActiveModelTrait, EntityTrait};
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
impl SettingsRepositoryTrait for SettingsLocalSqliteRepository {
    // ---------------------------
    // 設定（構造体）
    // ---------------------------

    async fn get_settings(&self) -> Result<Option<Settings>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        // 設定は単一レコードとして保存する（id = "app_settings"）
        let model = SettingEntity::find_by_id("app_settings").one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(model) = model {
            // SQLiteモデルからドメインモデルに変換
            let settings = model.to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(settings))
        } else {
            Ok(None)
        }
    }
}

#[async_trait::async_trait]
impl Repository<Settings, SettingsId> for SettingsLocalSqliteRepository {
    async fn save(&self, settings: &Settings) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        // ドメインモデルからSQLiteモデルに変換
        let active_model: SettingActiveModel = settings.to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        // 既存レコードがあるかチェックしてUPSERT
        if SettingEntity::find_by_id("app_settings")
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
            .is_some()
        {
            active_model.update(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        } else {
            active_model.insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        Ok(())
    }

    async fn find_by_id(&self, id: &SettingsId) -> Result<Option<Settings>, RepositoryError> {
        // 設定は固定ID "app_settings" のみサポート
        if id.to_string() == "app_settings" {
            self.get_settings().await
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<Settings>, RepositoryError> {
        match self.get_settings().await? {
            Some(settings) => Ok(vec![settings]),
            None => Ok(vec![]),
        }
    }

    async fn delete(&self, id: &SettingsId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;
        SettingEntity::delete_by_id(id.to_string()).exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(&self, id: &SettingsId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        match self.get_settings().await? {
            Some(_) => Ok(1),
            None => Ok(0),
        }
    }
}
