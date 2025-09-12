//! タスク繰り返しルール用SQLiteリポジトリ

use async_trait::async_trait;
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, TaskId, TaskRecurrenceId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_recurrence_repository_trait::TaskRecurrenceRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub struct TaskRecurrenceLocalSqliteRepository {
    // 最小限実装
}

impl Default for TaskRecurrenceLocalSqliteRepository {
    fn default() -> Self {
        Self {}
    }
}

impl TaskRecurrenceLocalSqliteRepository {
    pub fn new() -> Self {
        Self {}
    }
}

impl TaskRecurrenceRepositoryTrait for TaskRecurrenceLocalSqliteRepository {}

#[async_trait]
impl Repository<TaskRecurrence, TaskRecurrenceId> for TaskRecurrenceLocalSqliteRepository {
    async fn save(&self, _entity: &TaskRecurrence) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn find_by_id(
        &self,
        _id: &TaskRecurrenceId,
    ) -> Result<Option<TaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn delete(&self, _id: &TaskRecurrenceId) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn exists(&self, _id: &TaskRecurrenceId) -> Result<bool, RepositoryError> {
        // TODO: 実装
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        // TODO: 実装
        Ok(0)
    }
}

#[async_trait]
impl ProjectRelationRepository<TaskRecurrence, TaskId, RecurrenceRuleId>
    for TaskRecurrenceLocalSqliteRepository
{
    async fn add(
        &self,
        _project_id: &ProjectId,
        _parent_id: &TaskId,
        _child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn remove(
        &self,
        _project_id: &ProjectId,
        _parent_id: &TaskId,
        _child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn remove_all(
        &self,
        _project_id: &ProjectId,
        _parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn find_relations(
        &self,
        _project_id: &ProjectId,
        _parent_id: &TaskId,
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn exists(
        &self,
        _project_id: &ProjectId,
        _parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        // TODO: 実装
        Ok(false)
    }

    async fn count(
        &self,
        _project_id: &ProjectId,
        _parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        // TODO: 実装
        Ok(0)
    }

    async fn find_all(
        &self,
        _project_id: &ProjectId,
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn find_relation(
        &self,
        _project_id: &ProjectId,
        _parent_id: &TaskId,
        _child_id: &RecurrenceRuleId,
    ) -> Result<Option<TaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(None)
    }
}
