//! SubtaskAssignment用Automergeリポジトリ

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use chrono::Utc;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SubtaskAssignmentRelation {
    subtask_id: String,
    user_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct SubtaskAssignmentLocalAutomergeRepository {
    doc_manager: Arc<RwLock<DocumentManager>>,
}

impl SubtaskAssignmentLocalAutomergeRepository {
    pub fn new(doc_manager: Arc<RwLock<DocumentManager>>) -> Self {
        Self { doc_manager }
    }

    /// サブタスク割り当て関連のドキュメントタイプを取得（プロジェクト）
    fn get_document_type(project_id: &str) -> DocumentType {
        DocumentType::Project(ProjectId::from(project_id))
    }

    /// 指定サブタスクのユーザーIDリストを取得
    pub async fn find_user_ids_by_subtask_id(
        &self,
        project_id: &ProjectId,
        subtask_id: &SubTaskId,
    ) -> Result<Vec<UserId>, RepositoryError> {
        let doc_type = &DocumentType::Project(project_id.clone());

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;
        let assignments: Option<Vec<SubtaskAssignmentRelation>> = doc
            .load_data("subtask_assignments")
            .await?;

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
        _user_id: &UserId,
    ) -> Result<Vec<SubTaskId>, RepositoryError> {
        // ユーザーIDから直接プロジェクトIDを取得するのは困難なため、
        // 全プロジェクトを検索する必要があります。
        // 実装の簡略化のため、現在は空のベクターを返します。
        // 実際の使用では、プロジェクトリストを取得して各プロジェクトを検索する必要があります。
        Ok(vec![])
    }

    /// サブタスクとユーザーの割り当てを追加
    pub async fn add_assignment(
        &self,
        subtask_id: &SubTaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = doc
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 既存の割り当てが存在するかチェック
        let subtask_id_str = subtask_id.to_string();
        let user_id_str  = user_id.to_string();
        let exists = assignments.iter().any(|a| {
            a.subtask_id == subtask_id_str && a.user_id == user_id_str
        });

        if !exists {
            // 割り当てが存在しない場合のみ追加
            assignments.push(SubtaskAssignmentRelation {
                subtask_id: subtask_id_str,
                user_id: user_id_str,
                created_at: Utc::now(),
            });

            doc.save_data("subtask_assignments", &assignments).await?;
        }

        Ok(())
    }

    /// サブタスクとユーザーの割り当てを削除
    pub async fn remove_assignment(
        &self,
        subtask_id: &SubTaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = doc
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 指定された割り当てを削除
        let user_id_str = user_id.to_string();
        assignments.retain(|a| {
            !(a.subtask_id == subtask_id.to_string() && a.user_id == user_id_str)
        });

        doc.save_data("subtask_assignments", &assignments).await?;

        Ok(())
    }

    /// 指定サブタスクの全ての割り当てを削除
    pub async fn remove_all_assignments_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = doc
            .load_data("subtask_assignments")
            .await?
            .unwrap_or_default();

        // 指定されたサブタスクの全ての割り当てを削除
        assignments.retain(|a| a.subtask_id != subtask_id.to_string());

        doc.save_data("subtask_assignments", &assignments).await?;

        Ok(())
    }

    /// サブタスクのユーザー割り当てを一括更新（既存をすべて削除して新しい割り当てを追加）
    pub async fn update_subtask_assignments(
        &self,
        subtask_id: &SubTaskId,
        user_ids: &[UserId],
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<SubtaskAssignmentRelation> = doc
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

        doc.save_data("subtask_assignments", &assignments).await?;

        Ok(())
    }
}
