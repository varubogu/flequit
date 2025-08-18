//! Subtask用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::subtask::{Column, Entity as SubtaskEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::models::subtask::SubTask;
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::SubTaskId;
use async_trait::async_trait;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct SubtaskLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SubtaskLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_task(&self, task_id: &str) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    pub async fn find_completed_by_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .filter(Column::Completed.eq(true))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }
}

#[async_trait]
impl Repository<SubTask, SubTaskId> for SubtaskLocalSqliteRepository {
    async fn save(&self, subtask: &SubTask) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let active_model = subtask
            .to_sqlite_model()
            .await
            .map_err(RepositoryError::Conversion)?;
        active_model.insert(db).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = SubtaskEntity::find_by_id(id.to_string()).one(db).await? {
            let subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(Some(subtask))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<SubTask>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let subtask = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    async fn delete(&self, id: &SubTaskId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        SubtaskEntity::delete_by_id(id.to_string()).exec(db).await?;

        Ok(())
    }

    async fn exists(&self, id: &SubTaskId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = SubtaskEntity::find_by_id(id.to_string()).count(db).await?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = SubtaskEntity::find().count(db).await?;
        Ok(count)
    }
}
