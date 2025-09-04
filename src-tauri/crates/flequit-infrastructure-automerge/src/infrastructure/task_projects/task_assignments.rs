//! TaskAssignment用Automergeリポジトリ

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::types::id_types::{UserId, TaskId, ProjectId};
use chrono::Utc;
use flequit_types::errors::repository_error::RepositoryError;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TaskAssignmentRelation {
    task_id: String,
    user_id: String,
    created_at: chrono::DateTime<Utc>,
}

#[derive(Debug)]
pub struct TaskAssignmentLocalAutomergeRepository {
    doc_manager: Arc<RwLock<DocumentManager>>,
}

impl TaskAssignmentLocalAutomergeRepository {
    pub fn new(doc_manager: Arc<RwLock<DocumentManager>>) -> Self {
        Self { doc_manager }
    }

    /// タスク割り当て関連のドキュメントタイプを取得（プロジェクト）
    fn get_document_type(project_id: &str) -> DocumentType {
        DocumentType::Project(ProjectId::from(project_id))
    }

    /// 指定タスクのユーザーIDリストを取得
    pub async fn find_user_ids_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<Vec<UserId>, RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;
        let assignments: Option<Vec<TaskAssignmentRelation>> = doc
            .load_data("task_assignments")
            .await?;

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
        _user_id: &UserId,
    ) -> Result<Vec<TaskId>, RepositoryError> {
        // ユーザーIDから直接プロジェクトIDを取得するのは困難なため、
        // 全プロジェクトを検索する必要があります。
        // 実装の簡略化のため、現在は空のベクターを返します。
        // 実際の使用では、プロジェクトリストを取得して各プロジェクトを検索する必要があります。
        Ok(vec![])
    }

    /// タスクとユーザーの割り当てを追加
    pub async fn add_assignment(
        &self,
        task_id: &TaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = doc
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 既存の割り当てが存在するかチェック
        let task_id_str = task_id.to_string();
        let user_id_str = user_id.to_string();
        let exists = assignments.iter().any(|a| {
            a.task_id == task_id_str && a.user_id == user_id_str
        });

        if !exists {
            // 割り当てが存在しない場合のみ追加
            assignments.push(TaskAssignmentRelation {
                task_id: task_id.to_string(),
                user_id: user_id.to_string(),
                created_at: Utc::now(),
            });

            doc.save_data("task_assignments", &assignments).await?;
        }

        Ok(())
    }

    /// タスクとユーザーの割り当てを削除
    pub async fn remove_assignment(
        &self,
        task_id: &TaskId,
        user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = doc
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 指定された割り当てを削除
        let user_id_str = user_id.to_string();
        assignments.retain(|a| {
            !(a.task_id == task_id.to_string() && a.user_id == user_id_str)
        });

        doc.save_data("task_assignments", &assignments).await?;

        Ok(())
    }

    /// 指定タスクの全ての割り当てを削除
    pub async fn remove_all_assignments_by_task_id(
        &self,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = doc
            .load_data("task_assignments")
            .await?
            .unwrap_or_default();

        // 指定されたタスクの全ての割り当てを削除
        assignments.retain(|a| a.task_id != task_id.to_string());

        doc.save_data("task_assignments", &assignments).await?;

        Ok(())
    }

    /// 指定ユーザーの全ての割り当てを削除
    pub async fn remove_all_assignments_by_user_id(
        &self,
        _user_id: &UserId,
    ) -> Result<(), RepositoryError> {
        // 全プロジェクトからユーザーの割り当てを削除するのは複雑な処理になるため、
        // 実装の簡略化のため現在は何もしません。
        // 実際の使用では、プロジェクトリストを取得して各プロジェクトから削除する必要があります。
        Ok(())
    }

    /// タスクのユーザー割り当てを一括更新（既存をすべて削除して新しい割り当てを追加）
    pub async fn update_task_assignments(
        &self,
        task_id: &TaskId,
        user_ids: &[UserId],
    ) -> Result<(), RepositoryError> {
        let project_id = "default_project".to_string(); // TODO: プロジェクトID取得の実装が必要
        let doc_type = Self::get_document_type(&project_id);

        let mut doc_manager = self.doc_manager.write().await;
        let doc = doc_manager.get_or_create(&doc_type).await?;

        // 既存の割り当てリストを取得
        let mut assignments: Vec<TaskAssignmentRelation> = doc
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

        doc.save_data("task_assignments", &assignments).await?;

        Ok(())
    }
}
