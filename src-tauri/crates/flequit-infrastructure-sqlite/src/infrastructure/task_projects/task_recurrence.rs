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
    QueryOrder, TransactionTrait,
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
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(RepositoryError::from)?;

        let txn = db
            .begin()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // タスクごとに1つの繰り返しルールのみ許可する。
        TaskRecurrenceEntity::delete_many()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .exec(&txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let active = crate::models::task_recurrence::ActiveModel {
            project_id: Set(project_id.to_string()),
            task_id: Set(parent_id.to_string()),
            recurrence_rule_id: Set(child_id.to_string()),
            created_at: Set(*timestamp),
            updated_at: Set(*timestamp),
            deleted: Set(false),
            updated_by: Set(user_id.to_string()),
        };

        active
            .insert(&txn)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        txn.commit()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

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
            .map_err(RepositoryError::from)?;

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
            .map_err(RepositoryError::from)?;

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
            .map_err(RepositoryError::from)?;

        let models = TaskRecurrenceEntity::find()
            .filter(Column::ProjectId.eq(project_id.to_string()))
            .filter(Column::TaskId.eq(parent_id.to_string()))
            .order_by_desc(Column::UpdatedAt)
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
            .map_err(RepositoryError::from)?;

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
            .map_err(RepositoryError::from)?;

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
            .map_err(RepositoryError::from)?;

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
            .map_err(RepositoryError::from)?;

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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use sea_orm::{ConnectionTrait, DatabaseBackend, Statement};
    use tempfile::TempDir;

    async fn create_test_repository()
    -> Result<(TempDir, TaskRecurrenceLocalSqliteRepository), Box<dyn std::error::Error>> {
        let temp_dir = tempfile::tempdir()?;
        let db_path = temp_dir.path().join("task_recurrence_test.sqlite");
        let db_manager = Arc::new(RwLock::new(DatabaseManager::new_for_test(
            db_path.to_string_lossy().to_string(),
        )));

        {
            let manager = db_manager.read().await;
            manager.get_connection().await?;
        }

        Ok((
            temp_dir,
            TaskRecurrenceLocalSqliteRepository::new(db_manager),
        ))
    }

    async fn seed_parent_and_rules(
        repo: &TaskRecurrenceLocalSqliteRepository,
        project_id: &ProjectId,
        task_id: &TaskId,
        rule_ids: &[RecurrenceRuleId],
        user_id: &UserId,
        timestamp: DateTime<Utc>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let manager = repo.db_manager.read().await;
        let db = manager.get_connection().await?;
        let project_id = project_id.to_string();
        let task_id = task_id.to_string();
        let user_id = user_id.to_string();
        let list_id = "test-list";

        db.execute(Statement::from_sql_and_values(
            DatabaseBackend::Sqlite,
            "INSERT INTO projects (id, name, order_index, is_archived, created_at, updated_at, updated_by, deleted) VALUES (?, 'Test Project', 0, FALSE, ?, ?, ?, FALSE)",
            vec![
                project_id.clone().into(),
                timestamp.into(),
                timestamp.into(),
                user_id.clone().into(),
            ],
        ))
        .await?;
        db.execute(Statement::from_sql_and_values(
            DatabaseBackend::Sqlite,
            "INSERT INTO task_lists (project_id, id, name, order_index, is_archived, created_at, updated_at, deleted, updated_by) VALUES (?, ?, 'Test List', 0, FALSE, ?, ?, FALSE, ?)",
            vec![
                project_id.clone().into(),
                list_id.into(),
                timestamp.into(),
                timestamp.into(),
                user_id.clone().into(),
            ],
        ))
        .await?;
        db.execute(Statement::from_sql_and_values(
            DatabaseBackend::Sqlite,
            "INSERT INTO tasks (project_id, id, list_id, title, status, priority, order_index, is_archived, created_at, updated_at, deleted, updated_by) VALUES (?, ?, ?, 'Test Task', 'not_started', 0, 0, FALSE, ?, ?, FALSE, ?)",
            vec![
                project_id.clone().into(),
                task_id.into(),
                list_id.into(),
                timestamp.into(),
                timestamp.into(),
                user_id.clone().into(),
            ],
        ))
        .await?;

        for rule_id in rule_ids {
            db.execute(Statement::from_sql_and_values(
                DatabaseBackend::Sqlite,
                "INSERT INTO recurrence_rules (project_id, id, unit, interval, created_at, updated_at, deleted, updated_by) VALUES (?, ?, 'day', 1, ?, ?, FALSE, ?)",
                vec![
                    project_id.clone().into(),
                    rule_id.to_string().into(),
                    timestamp.into(),
                    timestamp.into(),
                    user_id.clone().into(),
                ],
            ))
            .await?;
        }

        Ok(())
    }

    #[tokio::test]
    async fn add_replaces_existing_rule_for_same_task() -> Result<(), Box<dyn std::error::Error>> {
        let (_temp_dir, repo) = create_test_repository().await?;
        let project_id = ProjectId::new();
        let task_id = TaskId::new();
        let first_rule_id = RecurrenceRuleId::new();
        let second_rule_id = RecurrenceRuleId::new();
        let user_id = UserId::new();
        let first_timestamp = Utc::now();
        let second_timestamp = first_timestamp + chrono::Duration::seconds(1);

        seed_parent_and_rules(
            &repo,
            &project_id,
            &task_id,
            &[first_rule_id, second_rule_id],
            &user_id,
            first_timestamp,
        )
        .await?;

        repo.add(
            &project_id,
            &task_id,
            &first_rule_id,
            &user_id,
            &first_timestamp,
        )
        .await?;
        repo.add(
            &project_id,
            &task_id,
            &second_rule_id,
            &user_id,
            &second_timestamp,
        )
        .await?;

        let relations = repo.find_relations(&project_id, &task_id).await?;
        assert_eq!(relations.len(), 1);
        assert_eq!(relations[0].recurrence_rule_id, second_rule_id);
        assert_eq!(relations[0].updated_by, user_id);
        assert_eq!(relations[0].updated_at, second_timestamp);

        Ok(())
    }
}
