//! TaskAssignment用Automergeリポジトリ

use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_assignment_repository_trait::TaskAssignmentRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Arc};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TaskAssignmentRelation {
    task_id: String,
    user_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct TaskAssignmentLocalAutomergeRepository {
    document_manager: Arc<RwLock<DocumentManager>>,
}

impl TaskAssignmentLocalAutomergeRepository {
    /// 新しいTaskAssignmentRepositoryを作成
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(RwLock::new(document_manager)),
        })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成
    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Document, RepositoryError> {
        let document_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.write().await;
        manager
            .get_or_create(&document_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 指定タスクのユーザーIDリストを取得
    pub async fn find_user_ids_by_task_id(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<Vec<UserId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<TaskAssignmentRelation>> =
            document.load_data("task_assignments").await?;

        if let Some(assignments) = assignments {
            let user_ids = assignments
                .into_iter()
                .filter(|a| a.task_id == task_id.to_string())
                .map(|a| UserId::from(a.user_id))
                .collect();
            Ok(user_ids)
        } else {
            Ok(vec![])
        }
    }

    /// 指定ユーザーに関連するタスクIDリストを取得
    pub async fn find_task_ids_by_user_id(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<TaskAssignmentRelation>> =
            document.load_data("task_assignments").await?;

        if let Some(assignments) = assignments {
            let task_ids = assignments
                .into_iter()
                .filter(|a| a.user_id == user_id.to_string())
                .map(|a| TaskId::from(a.task_id))
                .collect();
            Ok(task_ids)
        } else {
            Ok(vec![])
        }
    }

    /// タスクとユーザーの割り当てを追加
    pub async fn add_assignment(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = document
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 既存の割り当てが存在するかチェック
        let task_id_str = task_id.to_string();
        let user_id_str = user_id.to_string();
        let exists = assignments
            .iter()
            .any(|a| a.task_id == task_id_str && a.user_id == user_id_str);

        if !exists {
            // 割り当てが存在しない場合のみ追加
            assignments.push(TaskAssignmentRelation {
                task_id: task_id.to_string(),
                user_id: user_id.to_string(),
                created_at: Utc::now(),
            });

            document.save_data("task_assignments", &assignments).await?;
        }

        Ok(())
    }

    /// タスクとユーザーの割り当てを削除
    pub async fn remove_assignment(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = document
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 指定された割り当てを削除
        let user_id_str = user_id.to_string();
        assignments.retain(|a| !(a.task_id == task_id.to_string() && a.user_id == user_id_str));

        document.save_data("task_assignments", &assignments).await?;

        Ok(())
    }

    /// 指定タスクの全ての割り当てを削除
    pub async fn remove_all_assignments_by_task_id(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = document
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 指定されたタスクの全ての割り当てを削除
        assignments.retain(|a| a.task_id != task_id.to_string());

        document.save_data("task_assignments", &assignments).await?;

        Ok(())
    }

    /// 指定ユーザーの全ての割り当てを削除
    pub async fn remove_all_assignments_by_user_id(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = document
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 指定されたユーザーの全ての割り当てを削除
        assignments.retain(|a| a.user_id != user_id.to_string());

        document.save_data("task_assignments", &assignments).await?;
        Ok(())
    }

    /// タスクのユーザー割り当てを一括更新（既存をすべて削除して新しい割り当てを追加）
    pub async fn update_task_assignments(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_ids: &[UserId],
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = document
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 既存の割り当てを削除
        assignments.retain(|a| a.task_id != task_id.to_string());

        // 新しい割り当てを追加
        for user_id in user_ids {
            assignments.push(TaskAssignmentRelation {
                task_id: task_id.to_string(),
                user_id: user_id.to_string(),
                created_at: Utc::now(),
            });
        }

        document.save_data("task_assignments", &assignments).await?;

        Ok(())
    }
}

// TaskAssignmentRepositoryTrait の実装
impl TaskAssignmentRepositoryTrait for TaskAssignmentLocalAutomergeRepository {}

#[async_trait]
impl ProjectRelationRepository<TaskAssignment, TaskId, UserId>
    for TaskAssignmentLocalAutomergeRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        self.add_assignment(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        self.remove_assignment(project_id, parent_id, child_id)
            .await
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_assignments_by_task_id(project_id, parent_id)
            .await
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        let user_ids = self.find_user_ids_by_task_id(project_id, parent_id).await?;
        let mut relations = Vec::new();

        // 各ユーザーIDに対して TaskAssignment を作成
        for user_id in user_ids {
            let assignment = TaskAssignment {
                task_id: parent_id.clone(),
                user_id,
                created_at: chrono::Utc::now(), // 実際の作成日時の取得は追加実装が必要
            };
            relations.push(assignment);
        }

        Ok(relations)
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        let user_ids = self.find_user_ids_by_task_id(project_id, parent_id).await?;
        Ok(!user_ids.is_empty())
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        let user_ids = self.find_user_ids_by_task_id(project_id, parent_id).await?;
        Ok(user_ids.len() as u64)
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<Option<TaskAssignment>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<TaskAssignmentRelation>> =
            document.load_data("task_assignments").await?;

        if let Some(assignments) = assignments {
            if let Some(assignment_relation) = assignments
                .iter()
                .find(|a| a.task_id == parent_id.to_string() && a.user_id == child_id.to_string())
            {
                let assignment = TaskAssignment {
                    task_id: parent_id.clone(),
                    user_id: child_id.clone(),
                    created_at: assignment_relation.created_at,
                };
                Ok(Some(assignment))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<TaskAssignmentRelation>> =
            document.load_data("task_assignments").await?;

        if let Some(assignment_relations) = assignments {
            let task_assignments = assignment_relations
                .into_iter()
                .map(|rel| TaskAssignment {
                    task_id: TaskId::from(rel.task_id),
                    user_id: UserId::from(rel.user_id),
                    created_at: rel.created_at,
                })
                .collect();
            Ok(task_assignments)
        } else {
            Ok(vec![])
        }
    }
}
