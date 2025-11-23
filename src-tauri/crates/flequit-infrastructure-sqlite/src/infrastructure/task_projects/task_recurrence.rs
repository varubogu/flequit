//! タスク繰り返しルール用SQLiteリポジトリ

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use crate::models::task_recurrence::{Column, Entity as TaskRecurrenceEntity};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, TaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_recurrence_repository_trait::TaskRecurrenceRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct TaskRecurrenceLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl TaskRecurrenceLocalSqliteRepository {
    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// トランザクション内で指定タスクの全ての関連付けを削除
    ///
    /// トランザクションは呼び出し側（Facade層）が管理します。
    pub async fn remove_all_with_txn(
        &self,
        txn: &sea_orm::DatabaseTransaction,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        TaskRecurrenceEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .exec(txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }
}

impl TaskRecurrenceRepositoryTrait for TaskRecurrenceLocalSqliteRepository {}

#[async_trait]
impl ProjectRelationRepository<TaskRecurrence, TaskId, RecurrenceRuleId>
    for TaskRecurrenceLocalSqliteRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
        _user_id: &UserId,
        _timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 既存チェック
        let existing = TaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .filter(Column::RecurrenceRuleId.eq(child_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if existing.is_none() {
            let now = Utc::now();
            let active = crate::models::task_recurrence::ActiveModel {
                project_id: Set(project_id.to_string()),
                task_id: Set(parent_id.to_string()),
                recurrence_rule_id: Set(child_id.to_string()),
                created_at: Set(now),
                updated_at: Set(now),
                deleted: Set(false),
                updated_by: Set(project_id.to_string()),
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
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        TaskRecurrenceEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .filter(Column::RecurrenceRuleId.eq(child_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        TaskRecurrenceEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(())
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut result = Vec::new();
        for m in models {
            let d = TaskRecurrence {
                task_id: TaskId::from(m.task_id),
                recurrence_rule_id: RecurrenceRuleId::from(m.recurrence_rule_id),
                created_at: m.created_at,
                updated_at: m.updated_at,
                deleted: m.deleted,
                updated_by: UserId::from(m.updated_by),
            };
            result.push(d);
        }

        Ok(result)
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = TaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count > 0)
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = TaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count)
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = TaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut result = Vec::new();
        for m in models {
            let d = TaskRecurrence {
                task_id: TaskId::from(m.task_id),
                recurrence_rule_id: RecurrenceRuleId::from(m.recurrence_rule_id),
                created_at: m.created_at,
                updated_at: m.updated_at,
                deleted: m.deleted,
                updated_by: UserId::from(m.updated_by),
            };
            result.push(d);
        }

        Ok(result)
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<TaskRecurrence>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let model = TaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .filter(Column::RecurrenceRuleId.eq(child_id.to_string()))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        match model {
            Some(m) => {
                let d = TaskRecurrence {
                task_id: TaskId::from(m.task_id),
                recurrence_rule_id: RecurrenceRuleId::from(m.recurrence_rule_id),
                created_at: m.created_at,
                updated_at: m.updated_at,
                deleted: m.deleted,
                updated_by: UserId::from(m.updated_by),
            };
                Ok(Some(d))
            }
            None => Ok(None),
        }
    }
}
