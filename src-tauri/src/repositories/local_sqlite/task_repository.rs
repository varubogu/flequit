//! Task用SQLiteリポジトリ

use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait};
use crate::models::task::Task;
use crate::models::sqlite::task::{Entity as TaskEntity, ActiveModel as TaskActiveModel, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use super::{DatabaseManager, RepositoryError, Repository};

pub struct TaskRepository {
    db_manager: DatabaseManager,
}

impl TaskRepository {
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

#[async_trait::async_trait]
impl Repository<Task> for TaskRepository {
    async fn save(&self, task: &Task) -> Result<Task, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let active_model = task.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        saved.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<Task>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        if let Some(model) = TaskEntity::find_by_id(id).one(db).await? {
            let task = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(task))
        } else {
            Ok(None)
        }
    }

    async fn update(&self, task: &Task) -> Result<Task, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        
        let existing = TaskEntity::find_by_id(&task.id)
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("Task not found: {}", task.id)))?;

        let mut active_model: TaskActiveModel = existing.into();
        let new_active = task.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        
        active_model.sub_task_id = new_active.sub_task_id;
        active_model.project_id = new_active.project_id;
        active_model.list_id = new_active.list_id;
        active_model.title = new_active.title;
        active_model.description = new_active.description;
        active_model.status = new_active.status;
        active_model.priority = new_active.priority;
        active_model.start_date = new_active.start_date;
        active_model.end_date = new_active.end_date;
        active_model.is_range_date = new_active.is_range_date;
        active_model.recurrence_rule = new_active.recurrence_rule;
        active_model.assigned_user_ids = new_active.assigned_user_ids;
        active_model.tag_ids = new_active.tag_ids;
        active_model.order_index = new_active.order_index;
        active_model.is_archived = new_active.is_archived;
        active_model.updated_at = new_active.updated_at;
        
        let updated = active_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn delete_by_id(&self, id: &str) -> Result<bool, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = TaskEntity::delete_by_id(id).exec(db).await?;
        Ok(result.rows_affected > 0)
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
}