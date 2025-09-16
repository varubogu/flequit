//! サブタスク繰り返しルール用Automergeリポジトリ

use crate::infrastructure::document::Document;
use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, SubTaskId, SubTaskRecurrenceId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_recurrence_repository_trait::SubtaskRecurrenceRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Arc};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SubTaskRecurrenceRelation {
    subtask_id: String,
    recurrence_rule_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct SubtaskRecurrenceLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SubtaskRecurrenceLocalAutomergeRepository {
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
    ) -> Result<Self, RepositoryError> {
        Ok(Self { document_manager })
    }

    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Document, RepositoryError> {
        let document_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.lock().await;
        manager
            .get_or_create(&document_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    async fn load_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<SubTaskRecurrenceRelation>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let list: Option<Vec<SubTaskRecurrenceRelation>> =
            document.load_data("subtask_recurrences").await?;
        Ok(list.unwrap_or_default())
    }

    async fn save_all(
        &self,
        project_id: &ProjectId,
        list: &[SubTaskRecurrenceRelation],
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        document
            .save_data("subtask_recurrences", &list)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }
}

#[async_trait]
impl SubtaskRecurrenceRepositoryTrait for SubtaskRecurrenceLocalAutomergeRepository {
    async fn find_by_subtask_id(
        &self,
        _subtask_id: &SubTaskId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository methods with project_id for Automerge".into(),
        ))
    }

    async fn find_by_recurrence_rule_id(
        &self,
        _recurrence_rule_id: &RecurrenceRuleId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository methods with project_id for Automerge".into(),
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
            "Not supported on Automerge without project_id".into(),
        ))
    }

    async fn exists_by_subtask_id(&self, _subtask_id: &SubTaskId) -> Result<bool, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::exists with project_id instead".into(),
        ))
    }
}

#[async_trait]
impl Repository<SubTaskRecurrence, SubTaskRecurrenceId>
    for SubtaskRecurrenceLocalAutomergeRepository
{
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
            "Identified by (project_id, subtask_id, recurrence_rule_id) on Automerge".into(),
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
    for SubtaskRecurrenceLocalAutomergeRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        // サブタスクごとに1つのルールのみ許可（既存を置き換え）
        let mut list = self.load_all(project_id).await?;
        let s = parent_id.to_string();
        let r = child_id.to_string();

        list.retain(|x| x.subtask_id != s);
        list.push(SubTaskRecurrenceRelation {
            subtask_id: s,
            recurrence_rule_id: r,
            created_at: Utc::now(),
        });

        self.save_all(project_id, &list).await
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let mut list = self.load_all(project_id).await?;
        let s = parent_id.to_string();
        let r = child_id.to_string();
        list.retain(|x| !(x.subtask_id == s && x.recurrence_rule_id == r));
        self.save_all(project_id, &list).await
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let mut list = self.load_all(project_id).await?;
        let s = parent_id.to_string();
        list.retain(|x| x.subtask_id != s);
        self.save_all(project_id, &list).await
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let s = parent_id.to_string();
        let mut out = Vec::new();
        for v in list.into_iter().filter(|x| x.subtask_id == s) {
            out.push(SubTaskRecurrence {
                subtask_id: parent_id.clone(),
                recurrence_rule_id: RecurrenceRuleId::from(v.recurrence_rule_id),
                created_at: v.created_at,
            });
        }
        Ok(out)
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let s = parent_id.to_string();
        Ok(list.into_iter().any(|x| x.subtask_id == s))
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let s = parent_id.to_string();
        Ok(list.into_iter().filter(|x| x.subtask_id == s).count() as u64)
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        let list = self.load_all(project_id).await?;
        Ok(list
            .into_iter()
            .map(|v| SubTaskRecurrence {
                subtask_id: SubTaskId::from(v.subtask_id),
                recurrence_rule_id: RecurrenceRuleId::from(v.recurrence_rule_id),
                created_at: v.created_at,
            })
            .collect())
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let s = parent_id.to_string();
        let r = child_id.to_string();
        if let Some(found) = list
            .into_iter()
            .find(|x| x.subtask_id == s && x.recurrence_rule_id == r)
        {
            return Ok(Some(SubTaskRecurrence {
                subtask_id: parent_id.clone(),
                recurrence_rule_id: child_id.clone(),
                created_at: found.created_at,
            }));
        }
        Ok(None)
    }
}
