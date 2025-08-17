//! TaskList用SQLiteリポジトリ

use async_trait::async_trait;
use log::info;
use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait};
use crate::models::task_list::TaskList;
use crate::models::sqlite::task_list::{Entity as TaskListEntity, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::TaskListId;
use super::{DatabaseManager, RepositoryError};

pub struct TaskListLocalSqliteRepository {
    db_manager: DatabaseManager,
}

impl TaskListLocalSqliteRepository {
    pub fn new(db_manager: DatabaseManager) -> Self {
        Self { db_manager }
    }

    pub async fn find_by_project(&self, project_id: &str) -> Result<Vec<TaskList>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = TaskListEntity::find()
            .filter(Column::ProjectId.eq(project_id))
            .filter(Column::IsArchived.eq(false))
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut task_lists = Vec::new();
        for model in models {
            let task_list = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            task_lists.push(task_list);
        }

        Ok(task_lists)
    }
}

#[async_trait]
impl Repository<TaskList, TaskListId> for TaskListLocalSqliteRepository {
    async fn save(&self, task_list: &TaskList) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let active_model = task_list.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        Ok(())
    }

    async fn find_by_id(&self, id: &TaskListId) -> Result<Option<TaskList>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = TaskListEntity::find_by_id(id.to_string()).one(db).await? {
            let task_list = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(task_list))
        } else {
            Ok(None)
        }
    }

    async fn find_all(&self) -> Result<Vec<TaskList>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = TaskListEntity::find()
            .order_by_asc(Column::OrderIndex)
            .all(db)
            .await?;

        let mut task_lists = Vec::new();
        for model in models {
            let task_list = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            task_lists.push(task_list);
        }

        Ok(task_lists)
    }

    async fn delete(&self, id: &TaskListId) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = TaskListEntity::delete_by_id(id.to_string()).exec(db).await?;
        Ok(())
    }

    async fn exists(&self, id: &TaskListId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}
