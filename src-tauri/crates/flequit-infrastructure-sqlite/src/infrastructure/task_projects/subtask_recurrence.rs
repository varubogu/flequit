//! サブタスク繰り返しルール用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_projects::subtask_recurrence::{Column, Entity as SubTaskRecurrenceEntity};
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, SubTaskId, SubTaskRecurrenceId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_recurrence_repository_trait::SubtaskRecurrenceRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct SubtaskRecurrenceLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl SubtaskRecurrenceLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }
}

#[async_trait]
impl SubtaskRecurrenceRepositoryTrait for SubtaskRecurrenceLocalSqliteRepository {
    async fn find_by_subtask_id(
        &self,
        _subtask_id: &SubTaskId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository methods with project_id for SQLite".into(),
        ))
    }

    async fn find_by_recurrence_rule_id(
        &self,
        _recurrence_rule_id: &RecurrenceRuleId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository methods with project_id for SQLite".into(),
        ))
    }

    async fn find_all(&self) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::find_all(project_id) instead".into(),
        ))
    }

    async fn save(&self, _recurrence: &SubTaskRecurrence) -> Result<(), RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::add instead".into(),
        ))
    }

    async fn delete_by_subtask_id(&self, _subtask_id: &SubTaskId) -> Result<(), RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::remove_all with project_id instead".into(),
        ))
    }

    async fn delete_by_recurrence_rule_id(
        &self,
        _recurrence_rule_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Not supported on SQLite without project_id".into(),
        ))
    }

    async fn exists_by_subtask_id(&self, _subtask_id: &SubTaskId) -> Result<bool, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::exists with project_id instead".into(),
        ))
    }
}

#[async_trait]
impl Repository<SubTaskRecurrence, SubTaskRecurrenceId> for SubtaskRecurrenceLocalSqliteRepository {
    async fn save(&self, _entity: &SubTaskRecurrence) -> Result<(), RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::add instead".into(),
        ))
    }

    async fn find_by_id(
        &self,
        _id: &SubTaskRecurrenceId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Identified by (project_id, subtask_id, recurrence_rule_id) on SQLite".into(),
        ))
    }

    async fn find_all(&self) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::find_all(project_id) instead".into(),
        ))
    }

    async fn delete(&self, _id: &SubTaskRecurrenceId) -> Result<(), RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::remove instead".into(),
        ))
    }

    async fn exists(&self, _id: &SubTaskRecurrenceId) -> Result<bool, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::exists instead".into(),
        ))
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::count instead".into(),
        ))
    }
}

#[async_trait]
impl ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId>
    for SubtaskRecurrenceLocalSqliteRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let existing = SubTaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .filter(Column::RecurrenceRuleId.eq(child_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            let active = crate::models::task_projects::subtask_recurrence::ActiveModel {
                project_id: Set(project_id.to_string()),
                subtask_id: Set(parent_id.to_string()),
                recurrence_rule_id: Set(child_id.to_string()),
                created_at: Set(Utc::now()),
            };

            active
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        }

        Ok(())
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubTaskRecurrenceEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .filter(Column::RecurrenceRuleId.eq(child_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        SubTaskRecurrenceEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubTaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut result = Vec::new();
        for m in models {
            let d = SubTaskRecurrence {
                subtask_id: SubTaskId::from(m.subtask_id),
                recurrence_rule_id: RecurrenceRuleId::from(m.recurrence_rule_id),
                created_at: m.created_at,
            };
            result.push(d);
        }

        Ok(result)
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = SubTaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = SubTaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count)
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = SubTaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut result = Vec::new();
        for m in models {
            let d = SubTaskRecurrence {
                subtask_id: SubTaskId::from(m.subtask_id),
                recurrence_rule_id: RecurrenceRuleId::from(m.recurrence_rule_id),
                created_at: m.created_at,
            };
            result.push(d);
        }

        Ok(result)
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let model = SubTaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::SubtaskId.eq(parent_id.to_string()))
            .filter(Column::RecurrenceRuleId.eq(child_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        match model {
            Some(m) => {
                let d = SubTaskRecurrence {
                    subtask_id: SubTaskId::from(m.subtask_id),
                    recurrence_rule_id: RecurrenceRuleId::from(m.recurrence_rule_id),
                    created_at: m.created_at,
                };
                Ok(Some(d))
            }
            None => Ok(None),
        }
    }
}
