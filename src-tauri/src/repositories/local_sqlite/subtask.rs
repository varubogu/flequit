//! Subtask用SQLiteリポジトリ

use async_trait::async_trait;
use log::info;
use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait};
use crate::models::subtask::SubTask;
use crate::models::sqlite::subtask::{Entity as SubtaskEntity, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::SubTaskId;
use super::{DatabaseManager, RepositoryError};

pub struct SubtaskLocalSqliteRepository {
    db_manager: DatabaseManager,
}

impl SubtaskLocalSqliteRepository {
    pub fn new(db_manager: DatabaseManager) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_task(&self, task_id: &str) -> Result<Vec<SubTask>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let subtask = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    pub async fn find_completed_by_task(&self, task_id: &str) -> Result<Vec<SubTask>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .filter(Column::TaskId.eq(task_id))
            .filter(Column::Completed.eq(true))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let subtask = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }
}

#[async_trait]
impl Repository<SubTask, SubTaskId> for SubtaskLocalSqliteRepository {
    async fn save(&self, subtask: &SubTask) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let active_model = subtask.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = SubtaskEntity::find_by_id(id.to_string()).one(db).await? {
            let subtask = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(subtask))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<SubTask>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = SubtaskEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut subtasks = Vec::new();
        for model in models {
            let subtask = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            subtasks.push(subtask);
        }

        Ok(subtasks)
    }

    async fn delete(&self, id: &SubTaskId) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = SubtaskEntity::delete_by_id(id.to_string()).exec(db).await?;
        Ok(())
    }

    async fn exists(&self, id: &SubTaskId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}
