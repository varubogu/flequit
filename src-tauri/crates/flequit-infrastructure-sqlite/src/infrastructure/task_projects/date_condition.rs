//! DateCondition用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use flequit_model::models::task_projects::date_condition::DateCondition;
use flequit_types::errors::repository_error::RepositoryError;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_projects::date_condition::{Column, Entity as DateConditionEntity};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::date_condition_repository_trait::DateConditionRepositoryTrait;
use flequit_model::types::id_types::{DateConditionId, ProjectId};
use async_trait::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct DateConditionLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl DateConditionLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }
}

#[async_trait]
impl ProjectRepository<DateCondition, DateConditionId> for DateConditionLocalSqliteRepository {
    async fn save(&self, project_id: &ProjectId, entity: &DateCondition) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let sqlite_model = entity
            .to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        let active_model = crate::models::task_projects::date_condition::ActiveModel {
            id: Set(sqlite_model.id.clone()),
            relation: Set(sqlite_model.relation.clone()),
            reference_date: Set(sqlite_model.reference_date),
            created_at: Set(sqlite_model.created_at),
            updated_at: Set(sqlite_model.updated_at),
        };

        active_model.insert(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(&self, project_id: &ProjectId, id: &DateConditionId) -> Result<Option<DateCondition>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = DateConditionEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let date_condition = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(date_condition))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<DateCondition>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = DateConditionEntity::find().all(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut date_conditions = Vec::new();
        for model in models {
            let date_condition = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            date_conditions.push(date_condition);
        }

        Ok(date_conditions)
    }

    async fn delete(&self, project_id: &ProjectId, id: &DateConditionId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        DateConditionEntity::delete_many()
            .filter(Column::Id.eq(id.as_str()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn exists(&self, project_id: &ProjectId, id: &DateConditionId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let count = DateConditionEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let count = DateConditionEntity::find().count(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}

#[async_trait]
impl DateConditionRepositoryTrait for DateConditionLocalSqliteRepository {
}
