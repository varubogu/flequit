//! Task用SQLiteリポジトリ

use super::database_manager::DatabaseManager;
use crate::errors::repository_error::RepositoryError;
use crate::models::sqlite::task::{Column, Entity as TaskEntity};
use crate::models::sqlite::{DomainToSqliteConverter, SqliteModelConverter};
use crate::models::task::Task;
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::TaskId;
use async_trait::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TaskLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TaskLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_project(&self, project_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::ProjectId.eq(project_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_task_list(&self, list_id: &str) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::ListId.eq(list_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }

    pub async fn find_by_status(&self, status: &str) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::Status.eq(status))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }
}

#[async_trait]
impl Repository<Task, TaskId> for TaskLocalSqliteRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, task: &Task) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let active_model = task
            .to_sqlite_model()
            .await
            .map_err(RepositoryError::Conversion)?;

        // 既存レコードを確認
        let existing = TaskEntity::find_by_id(&task.id.to_string()).one(db).await?;

        if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model.update(db).await?;
        } else {
            // 既存レコードがない場合は挿入
            active_model.insert(db).await?;
        }
        Ok(())
    }

    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        if let Some(model) = TaskEntity::find_by_id(id.to_string()).one(db).await? {
            let task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            Ok(Some(task))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;

        let models = TaskEntity::find()
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut tasks = Vec::new();
        for model in models {
            let task = model
                .to_domain_model()
                .await
                .map_err(RepositoryError::Conversion)?;
            tasks.push(task);
        }

        Ok(tasks)
    }

    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        TaskEntity::delete_by_id(id.to_string()).exec(db).await?;
        Ok(())
    }

    async fn exists(&self, id: &TaskId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = TaskEntity::find_by_id(id.to_string()).count(db).await?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await?;
        let count = TaskEntity::find().count(db).await?;
        Ok(count)
    }
}
