//! WeekdayCondition用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_projects::weekday_condition::{Column, Entity as WeekdayConditionEntity};
use crate::models::{DomainToSqliteConverterWithProjectId, SqliteModelConverter};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
use flequit_model::types::id_types::{ProjectId, WeekdayConditionId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::weekday_condition_repository_trait::WeekdayConditionRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, Set};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct WeekdayConditionLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl WeekdayConditionLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }
}

#[async_trait]
impl ProjectRepository<WeekdayCondition, WeekdayConditionId>
    for WeekdayConditionLocalSqliteRepository
{
    async fn save(
        &self,
        project_id: &ProjectId,
        entity: &WeekdayCondition,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let sqlite_model = entity
            .to_sqlite_model_with_project_id(project_id)
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        let active_model = crate::models::task_projects::weekday_condition::ActiveModel {
            id: Set(sqlite_model.id.clone()),
            project_id: Set(sqlite_model.project_id.clone()),
            if_weekday: Set(sqlite_model.if_weekday.clone()),
            then_direction: Set(sqlite_model.then_direction.clone()),
            then_target: Set(sqlite_model.then_target.clone()),
            then_weekday: Set(sqlite_model.then_weekday.clone()),
            then_days: Set(sqlite_model.then_days),
            created_at: Set(sqlite_model.created_at),
            updated_at: Set(sqlite_model.updated_at),
            deleted: Set(sqlite_model.deleted),
            updated_by: Set(sqlite_model.updated_by),
        };

        active_model
            .insert(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_by_id(
        &self,
        _project_id: &ProjectId,
        id: &WeekdayConditionId,
    ) -> Result<Option<WeekdayCondition>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        if let Some(model) = WeekdayConditionEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let weekday_condition = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(weekday_condition))
        } else {
            Ok(None)
        }
    }

    async fn find_all(
        &self,
        _project_id: &ProjectId,
    ) -> Result<Vec<WeekdayCondition>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let models = WeekdayConditionEntity::find()
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut weekday_conditions = Vec::new();
        for model in models {
            let weekday_condition = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            weekday_conditions.push(weekday_condition);
        }

        Ok(weekday_conditions)
    }

    async fn delete(
        &self,
        _project_id: &ProjectId,
        id: &WeekdayConditionId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        WeekdayConditionEntity::delete_many()
            .filter(Column::Id.eq(id.as_str()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn exists(
        &self,
        _project_id: &ProjectId,
        id: &WeekdayConditionId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let count = WeekdayConditionEntity::find()
            .filter(Column::Id.eq(id.as_str()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(&self, _project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let count = WeekdayConditionEntity::find()
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}

#[async_trait]
impl WeekdayConditionRepositoryTrait for WeekdayConditionLocalSqliteRepository {}
