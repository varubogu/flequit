//! サブタスク繰り返しルール用Automergeリポジトリ

use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_recurrence_repository_trait::SubtaskRecurrenceRepositoryTrait;
use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
use flequit_model::types::id_types::{SubTaskRecurrenceId, SubTaskId, RecurrenceRuleId, ProjectId};

#[derive(Debug)]
pub struct SubtaskRecurrenceLocalAutomergeRepository {
    // 最小限実装
}

impl Default for SubtaskRecurrenceLocalAutomergeRepository {
    fn default() -> Self {
        Self {}
    }
}

impl SubtaskRecurrenceLocalAutomergeRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl SubtaskRecurrenceRepositoryTrait for SubtaskRecurrenceLocalAutomergeRepository {
    async fn find_by_subtask_id(&self, _subtask_id: &SubTaskId) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(None)
    }

    async fn find_by_recurrence_rule_id(&self, _recurrence_rule_id: &RecurrenceRuleId) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn find_all(&self) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn save(&self, _recurrence: &SubTaskRecurrence) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn delete_by_subtask_id(&self, _subtask_id: &SubTaskId) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn delete_by_recurrence_rule_id(&self, _recurrence_rule_id: &RecurrenceRuleId) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn exists_by_subtask_id(&self, _subtask_id: &SubTaskId) -> Result<bool, RepositoryError> {
        // TODO: 実装
        Ok(false)
    }
}

#[async_trait]
impl Repository<SubTaskRecurrence, SubTaskRecurrenceId> for SubtaskRecurrenceLocalAutomergeRepository {
    async fn save(&self, _entity: &SubTaskRecurrence) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn find_by_id(&self, _id: &SubTaskRecurrenceId) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(None)
    }

    async fn find_all(&self) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn delete(&self, _id: &SubTaskRecurrenceId) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn exists(&self, _id: &SubTaskRecurrenceId) -> Result<bool, RepositoryError> {
        // TODO: 実装
        Ok(false)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        // TODO: 実装
        Ok(0)
    }
}

#[async_trait]
impl ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId> for SubtaskRecurrenceLocalAutomergeRepository {
    async fn add(&self, _project_id: &ProjectId, _parent_id: &SubTaskId, _child_id: &RecurrenceRuleId) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn remove(&self, _project_id: &ProjectId, _parent_id: &SubTaskId, _child_id: &RecurrenceRuleId) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn remove_all(&self, _project_id: &ProjectId, _parent_id: &SubTaskId) -> Result<(), RepositoryError> {
        // TODO: 実装
        Ok(())
    }

    async fn find_relations(&self, _project_id: &ProjectId, _parent_id: &SubTaskId) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn exists(&self, _project_id: &ProjectId, _parent_id: &SubTaskId) -> Result<bool, RepositoryError> {
        // TODO: 実装
        Ok(false)
    }

    async fn count(&self, _project_id: &ProjectId, _parent_id: &SubTaskId) -> Result<u64, RepositoryError> {
        // TODO: 実装
        Ok(0)
    }

    async fn find_all(&self, _project_id: &ProjectId) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(vec![])
    }

    async fn find_relation(&self, _project_id: &ProjectId, _parent_id: &SubTaskId, _child_id: &RecurrenceRuleId) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        // TODO: 実装
        Ok(None)
    }
}