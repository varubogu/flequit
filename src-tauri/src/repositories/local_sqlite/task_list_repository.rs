//! TaskList用SQLiteリポジトリ

use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait};
use crate::models::task_list::TaskList;
use crate::models::sqlite::task_list::{Entity as TaskListEntity, ActiveModel as TaskListActiveModel, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use super::{DatabaseManager, RepositoryError, Repository};

pub struct TaskListRepository {
    db_manager: DatabaseManager,
}

impl TaskListRepository {
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

#[async_trait::async_trait]
impl Repository<TaskList> for TaskListRepository {
    async fn save(&self, task_list: &TaskList) -> Result<TaskList, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let active_model = task_list.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        saved.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<TaskList>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        if let Some(model) = TaskListEntity::find_by_id(id).one(db).await? {
            let task_list = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(task_list))
        } else {
            Ok(None)
        }
    }

    async fn update(&self, task_list: &TaskList) -> Result<TaskList, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let existing = TaskListEntity::find_by_id(&task_list.id.to_string())
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("TaskList not found: {}", task_list.id)))?;

        let mut active_model: TaskListActiveModel = existing.into();
        let new_active = task_list.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        
        active_model.name = new_active.name;
        active_model.description = new_active.description;
        active_model.color = new_active.color;
        active_model.order_index = new_active.order_index;
        active_model.is_archived = new_active.is_archived;
        active_model.updated_at = new_active.updated_at;
        
        let updated = active_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn delete_by_id(&self, id: &str) -> Result<bool, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = TaskListEntity::delete_by_id(id).exec(db).await?;
        Ok(result.rows_affected > 0)
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
}