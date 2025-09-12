//! SubtaskAssignment用Automergeリポジトリ

use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use chrono::Utc;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_assignment_repository_trait::SubTaskAssignmentRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Arc};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SubtaskAssignmentRelation {
    subtask_id: String,
    user_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct SubtaskAssignmentLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SubtaskAssignmentLocalAutomergeRepository {
    /// 新しいSubtaskAssignmentRepositoryを作成
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成
    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
    ) -> Result<Self, RepositoryError> {
        Ok(Self {
            document_manager,
        })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成
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

    /// 指定サブタスクのユーザーIDリストを取得
    pub async fn find_user_ids_by_subtask_id(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
    ) -> Result<Vec<UserId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<SubtaskAssignmentRelation>> =
            document.load_data("subtask_assignments").await?;

        if let Some(assignments) = assignments {
            let user_ids = assignments
                .into_iter()
                .filter(|a| a.subtask_id == subtask_id.to_string())
                .map(|a| UserId::from(a.user_id))
                .collect();
            Ok(user_ids)
        } else {
            Ok(vec![])
        }
    }

    /// 指定ユーザーに関連するサブタスクIDリストを取得
    pub async fn find_subtask_ids_by_user_id(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
    ) -> Result<Vec<SubTaskId>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<SubtaskAssignmentRelation>> =
            document.load_data("subtask_assignments").await?;

        if let Some(assignments) = assignments {
            let subtask_ids = assignments
                .into_iter()
                .filter(|a| a.user_id == user_id.to_string())
                .map(|a| SubTaskId::from(a.subtask_id))
                .collect();
            Ok(subtask_ids)
        } else {
            Ok(vec![])
        }
    }

    /// サブタスクとユーザーの割り当てを追加
    pub async fn add_assignment(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = document
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 既存の割り当てが存在するかチェック
        let subtask_id_str = subtask_id.to_string();
        let user_id_str = user_id.to_string();
        let exists = assignments
            .iter()
            .any(|a| a.subtask_id == subtask_id_str && a.user_id == user_id_str);

        if !exists {
            // 割り当てが存在しない場合のみ追加
            assignments.push(SubtaskAssignmentRelation {
                subtask_id: subtask_id_str,
                user_id: user_id_str,
                created_at: Utc::now(),
            });

            document
                .save_data("subtask_assignments", &assignments)
                .await?;
        }

        Ok(())
    }

    /// サブタスクとユーザーの割り当てを削除
    pub async fn remove_assignment(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = document
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 指定された割り当てを削除
        let user_id_str = user_id.to_string();
        assignments
            .retain(|a| !(a.subtask_id == subtask_id.to_string() && a.user_id == user_id_str));

        document
            .save_data("subtask_assignments", &assignments)
            .await?;

        Ok(())
    }

    /// 指定サブタスクの全ての割り当てを削除
    pub async fn remove_all_assignments_by_subtask_id(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = document
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 指定されたサブタスクの全ての割り当てを削除
        assignments.retain(|a| a.subtask_id != subtask_id.to_string());

        document
            .save_data("subtask_assignments", &assignments)
            .await?;

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
        let mut assignments: Vec<SubtaskAssignmentRelation> = document
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 指定されたユーザーの全ての割り当てを削除
        assignments.retain(|a| a.user_id != user_id.to_string());

        document
            .save_data("subtask_assignments", &assignments)
            .await?;
        Ok(())
    }

    /// サブタスクのユーザー割り当てを一括更新（既存をすべて削除して新しい割り当てを追加）
    pub async fn update_subtask_assignments(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
        user_ids: &[UserId],
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = document
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 既存の割り当てを削除
        assignments.retain(|a| a.subtask_id != subtask_id.to_string());

        // 新しい割り当てを追加
        for user_id in user_ids {
            assignments.push(SubtaskAssignmentRelation {
                subtask_id: subtask_id.to_string(),
                user_id: user_id.to_string(),
                created_at: Utc::now(),
            });
        }

        document
            .save_data("subtask_assignments", &assignments)
            .await?;

        Ok(())
    }
}

// SubTaskAssignmentRepositoryTrait の実装
impl SubTaskAssignmentRepositoryTrait for SubtaskAssignmentLocalAutomergeRepository {}

#[async_trait]
impl ProjectRelationRepository<SubTaskAssignment, SubTaskId, UserId>
    for SubtaskAssignmentLocalAutomergeRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        self.add_assignment(project_id, parent_id, child_id).await
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        self.remove_assignment(project_id, parent_id, child_id)
            .await
    }

    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_assignments_by_subtask_id(project_id, parent_id)
            .await
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
        let user_ids = self
            .find_user_ids_by_subtask_id(project_id, parent_id)
            .await?;
        let mut relations = Vec::new();

        // 各ユーザーIDに対して SubTaskAssignment を作成
        for user_id in user_ids {
            let assignment = SubTaskAssignment {
                subtask_id: parent_id.clone(),
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
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let user_ids = self
            .find_user_ids_by_subtask_id(project_id, parent_id)
            .await?;
        Ok(!user_ids.is_empty())
    }

    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        let user_ids = self
            .find_user_ids_by_subtask_id(project_id, parent_id)
            .await?;
        Ok(user_ids.len() as u64)
    }

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
    ) -> Result<Option<SubTaskAssignment>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<SubtaskAssignmentRelation>> =
            document.load_data("subtask_assignments").await?;

        if let Some(assignments) = assignments {
            if let Some(assignment_relation) = assignments.iter().find(|a| {
                a.subtask_id == parent_id.to_string() && a.user_id == child_id.to_string()
            }) {
                let assignment = SubTaskAssignment {
                    subtask_id: parent_id.clone(),
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
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let assignments: Option<Vec<SubtaskAssignmentRelation>> =
            document.load_data("subtask_assignments").await?;

        if let Some(assignment_relations) = assignments {
            let subtask_assignments = assignment_relations
                .into_iter()
                .map(|rel| SubTaskAssignment {
                    subtask_id: SubTaskId::from(rel.subtask_id),
                    user_id: UserId::from(rel.user_id),
                    created_at: rel.created_at,
                })
                .collect();
            Ok(subtask_assignments)
        } else {
            Ok(vec![])
        }
    }
}
