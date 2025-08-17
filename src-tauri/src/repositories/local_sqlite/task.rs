//! Task用SQLiteリポジトリ

use async_trait::async_trait;
use log::info;
use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait};
use crate::models::task::Task;
use crate::models::sqlite::task::{Entity as TaskEntity, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::TaskId;
use super::{DatabaseManager, RepositoryError};

pub struct TaskLocalSqliteRepository {
    db_manager: DatabaseManager,
}

impl TaskLocalSqliteRepository {
    pub fn new(db_manager: DatabaseManager) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_project(&self, project_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::ProjectId.eq(project_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_task_list(&self, list_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::ListId.eq(list_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_status(&self, status: &str) -> Result<Vec<Task>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::Status.eq(status))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }
}

#[async_trait]
impl Repository<Task, TaskId> for TaskLocalSqliteRepository {
    async fn save(&self, task: &Task) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let active_model = task.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = TaskEntity::find_by_id(id.to_string()).one(db).await? {
            let task = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(task))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }

    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = TaskEntity::delete_by_id(id.to_string()).exec(db).await?;
        Ok(())
    }

    async fn exists(&self, id: &TaskId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}
