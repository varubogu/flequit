//! DueDateButtons用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use flequit_model::models::app_settings::due_date_buttons::DueDateButtons;
use flequit_types::errors::repository_error::RepositoryError;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::app_settings::due_date_buttons::{Column, Entity as DueDateButtonsEntity};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::app_settings::due_date_buttons_repository_trait::DueDateButtonsRepositoryTrait;
use flequit_model::types::id_types::DueDateButtonsId;
use async_trait::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct DueDateButtonsLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl DueDateButtonsLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// 固定IDで設定を管理（単一の設定オブジェクト）
    const SETTINGS_ID: &'static str = "due_date_buttons_config";
}

#[async_trait]
impl Repository<DueDateButtons, DueDateButtonsId> for DueDateButtonsLocalSqliteRepository {
    async fn save(&self, entity: &DueDateButtons) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let sqlite_model = entity
            .to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        let active_model = crate::models::app_settings::due_date_buttons::ActiveModel {
            id: Set(sqlite_model.id.clone()),
            name: Set(sqlite_model.name.clone()),
            is_visible: Set(sqlite_model.is_visible),
            display_order: Set(sqlite_model.display_order),
            created_at: Set(sqlite_model.created_at),
            updated_at: Set(sqlite_model.updated_at),
        };

        active_model.insert(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(&self, id: &DueDateButtonsId) -> Result<Option<DueDateButtons>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = DueDateButtonsEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let due_date_buttons = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(due_date_buttons))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<DueDateButtons>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = DueDateButtonsEntity::find().all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut due_date_buttons = Vec::new();
        for model in models {
            let button = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            due_date_buttons.push(button);
        }

        Ok(due_date_buttons)
    }

    async fn delete(&self, id: &DueDateButtonsId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        DueDateButtonsEntity::delete_many()
            .filter(Column::Id.eq(id.as_str()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn exists(&self, id: &DueDateButtonsId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let count = DueDateButtonsEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let count = DueDateButtonsEntity::find().count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}

#[async_trait]
impl DueDateButtonsRepositoryTrait for DueDateButtonsLocalSqliteRepository {
    async fn get_due_date_buttons(&self) -> Result<Option<DueDateButtons>, RepositoryError> {
        let settings_id = DueDateButtonsId::from(Self::SETTINGS_ID);
        self.find_by_id(&settings_id).await
    }

    async fn save_due_date_buttons(&self, buttons: &DueDateButtons) -> Result<(), RepositoryError> {
        self.save(buttons).await
    }

    async fn reset_due_date_buttons(&self) -> Result<(), RepositoryError> {
        let settings_id = DueDateButtonsId::from(Self::SETTINGS_ID);
        self.delete(&settings_id).await
    }
}
