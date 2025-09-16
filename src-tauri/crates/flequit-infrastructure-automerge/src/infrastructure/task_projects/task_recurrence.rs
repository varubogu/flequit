//! タスク繰り返しルール用Automergeリポジトリ

use crate::infrastructure::document::Document;
use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, TaskId, TaskRecurrenceId};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_recurrence_repository_trait::TaskRecurrenceRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Arc};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TaskRecurrenceRelation {
    task_id: String,
    recurrence_rule_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct TaskRecurrenceLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TaskRecurrenceLocalAutomergeRepository {
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

    async fn load_all(&self, project_id: &ProjectId) -> Result<Vec<TaskRecurrenceRelation>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let list: Option<Vec<TaskRecurrenceRelation>> = document.load_data("task_recurrences").await?;
        Ok(list.unwrap_or_default())
    }

    async fn save_all(&self, project_id: &ProjectId, list: &[TaskRecurrenceRelation]) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        document
            .save_data("task_recurrences", &list)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }
}

impl TaskRecurrenceRepositoryTrait for TaskRecurrenceLocalAutomergeRepository {}

#[async_trait]
impl Repository<TaskRecurrence, TaskRecurrenceId> for TaskRecurrenceLocalAutomergeRepository {
    async fn save(&self, _entity: &TaskRecurrence) -> Result<(), RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::add instead".into(),
        ))
    }

    async fn find_by_id(
        &self,
        _id: &TaskRecurrenceId,
    ) -> Result<Option<TaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Identified by (project_id, task_id, recurrence_rule_id) on Automerge".into(),
        ))
    }

    async fn find_all(&self) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::find_all(project_id) instead".into(),
        ))
    }

    async fn delete(&self, _id: &TaskRecurrenceId) -> Result<(), RepositoryError> {
        Err(RepositoryError::InvalidOperation(
            "Use ProjectRelationRepository::remove instead".into(),
        ))
    }

    async fn exists(&self, _id: &TaskRecurrenceId) -> Result<bool, RepositoryError> {
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
impl ProjectRelationRepository<TaskRecurrence, TaskId, RecurrenceRuleId>
    for TaskRecurrenceLocalAutomergeRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        // タスクごとに1つのルールのみ許可（既存を置き換え）
        let mut list = self.load_all(project_id).await?;
        let task_id_str = parent_id.to_string();
        let rule_id_str = child_id.to_string();

        list.retain(|x| x.task_id != task_id_str);
        list.push(TaskRecurrenceRelation {
            task_id: task_id_str,
            recurrence_rule_id: rule_id_str,
            created_at: Utc::now(),
        });

        self.save_all(project_id, &list).await
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        let mut list = self.load_all(project_id).await?;
        let t = parent_id.to_string();
        let r = child_id.to_string();
        list.retain(|x| !(x.task_id == t && x.recurrence_rule_id == r));
        self.save_all(project_id, &list).await
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let mut list = self.load_all(project_id).await?;
        let t = parent_id.to_string();
        list.retain(|x| x.task_id != t);
        self.save_all(project_id, &list).await
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let t = parent_id.to_string();
        let mut out = Vec::new();
        for v in list.into_iter().filter(|x| x.task_id == t) {
            out.push(TaskRecurrence {
                task_id: parent_id.clone(),
                recurrence_rule_id: RecurrenceRuleId::from(v.recurrence_rule_id),
                created_at: v.created_at,
            });
        }
        Ok(out)
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let t = parent_id.to_string();
        Ok(list.into_iter().any(|x| x.task_id == t))
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let t = parent_id.to_string();
        Ok(list.into_iter().filter(|x| x.task_id == t).count() as u64)
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        let list = self.load_all(project_id).await?;
        Ok(list
            .into_iter()
            .map(|v| TaskRecurrence {
                task_id: TaskId::from(v.task_id),
                recurrence_rule_id: RecurrenceRuleId::from(v.recurrence_rule_id),
                created_at: v.created_at,
            })
            .collect())
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<TaskRecurrence>, RepositoryError> {
        let list = self.load_all(project_id).await?;
        let t = parent_id.to_string();
        let r = child_id.to_string();
        if let Some(found) = list
            .into_iter()
            .find(|x| x.task_id == t && x.recurrence_rule_id == r)
        {
            return Ok(Some(TaskRecurrence {
                task_id: parent_id.clone(),
                recurrence_rule_id: child_id.clone(),
                created_at: found.created_at,
            }));
        }
        Ok(None)
    }
}
