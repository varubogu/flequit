//! TaskList用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::models::task_list::{Column, Entity as TaskListEntity};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_model::types::id_types::TaskListId;
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use crate::errors::sqlite_error::SQLiteError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TaskListLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TaskListLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_project(
        &self,
        project_id: &str,
    ) -> Result<Vec<TaskList>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = TaskListEntity::find()
            .filter(Column::ProjectId.eq(project_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut task_lists = Vec::new();
        for model in models {
            let task_list = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            task_lists.push(task_list);
        }

        Ok(task_lists)
    }
}

#[async_trait]
impl Repository<TaskList, TaskListId> for TaskListLocalSqliteRepository {
    async fn save(&self, task_list: &TaskList) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;
        let active_model = task_list
            .to_sqlite_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

        // 既存レコードを確認
        let existing = TaskListEntity::find_by_id(&task_list.id.to_string())
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_some() {
            // 既存レコードがある場合は更新
            active_model.update(db).await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        } else {
            // 既存レコードがない場合は挿入
            active_model.insert(db).await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }
        Ok(())
    }

    async fn find_by_id(&self, id: &TaskListId) -> Result<Option<TaskList>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = TaskListEntity::find_by_id(id.to_string()).one(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))? {
            let task_list = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(task_list))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<TaskList>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;

        let models = TaskListEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut task_lists = Vec::new();
        for model in models {
            let task_list = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            task_lists.push(task_list);
        }

        Ok(task_lists)
    }

    async fn delete(&self, id: &TaskListId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;
        TaskListEntity::delete_by_id(id.to_string())
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn exists(&self, id: &TaskListId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;
        let count = TaskListEntity::find_by_id(id.to_string()).count(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager.get_connection().await.map_err(|e| RepositoryError::from(e))?;
        let count = TaskListEntity::find().count(db).await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
