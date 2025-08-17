//! Subtask用SQLiteリポジトリ

use log::info;
use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait};
use crate::models::subtask::SubTask;
use crate::models::sqlite::subtask::{Entity as SubtaskEntity, ActiveModel as SubtaskActiveModel, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::SubTaskId;
use super::{DatabaseManager, RepositoryError};

pub struct SubtaskRepository {
    db_manager: DatabaseManager,
}

impl SubtaskRepository {
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

#[async_trait::async_trait]
impl Repository<SubTask, SubTaskId> for SubtaskRepository {
    async fn save(&self, subtask: &SubTask) -> Result<SubTask, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let active_model = subtask.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
        let saved = active_model.insert(db).await?;
        saved.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn find_by_id(&self, id: &str) -> Result<Option<SubTask>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = SubtaskEntity::find_by_id(id).one(db).await? {
            let subtask = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(subtask))
        } else {
            Ok(None)
        }
    }

    async fn update(&self, subtask: &SubTask) -> Result<SubTask, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let existing = SubtaskEntity::find_by_id(&subtask.id.to_string())
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("Subtask not found: {}", subtask.id)))?;

        let mut active_model: SubtaskActiveModel = existing.into();
        let new_active = subtask.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;

        active_model.task_id = new_active.task_id;
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
        active_model.completed = new_active.completed;
        active_model.updated_at = new_active.updated_at;

        let updated = active_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    async fn delete_by_id(&self, id: &str) -> Result<bool, RepositoryError> {
        let db = self.db_manager.get_connection().await?;
        let result = SubtaskEntity::delete_by_id(id).exec(db).await?;
        Ok(result.rows_affected > 0)
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
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        info!("ProjectUnifiedRepository::save");
        info!("{:?}", entity);

        Ok(())
    }

    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        info!("ProjectUnifiedRepository::find_by_id");
        info!("{:?}", id);
        Ok(Option::from(None))
    }

    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        info!("ProjectUnifiedRepository::find_all");
        Ok(vec![])
    }

    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        info!("ProjectUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}
