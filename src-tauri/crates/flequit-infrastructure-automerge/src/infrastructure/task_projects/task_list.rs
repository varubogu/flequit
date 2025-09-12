use super::super::document_manager::{DocumentManager, DocumentType};
use crate::infrastructure::document::Document;
use async_trait::async_trait;
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_model::types::id_types::{ProjectId, TaskListId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::task_list_repository_trait::TaskListRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;

/// TaskList用のAutomerge-Repoリポジトリ
///
/// ステートレス設計でDocumentManagerを保持し、project_idは動的取得する
#[derive(Debug)]
pub struct TaskListLocalAutomergeRepository {
    document_manager: Arc<tokio::sync::RwLock<DocumentManager>>,
}

impl TaskListLocalAutomergeRepository {
    /// 新しいTaskListRepositoryを作成
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(tokio::sync::RwLock::new(document_manager)),
        })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成
    async fn get_or_create_document(
        &self,
        project_id: &ProjectId,
    ) -> Result<Document, RepositoryError> {
        let doc_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.write().await;
        manager
            .get_or_create(&doc_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 指定されたプロジェクトの全タスクリストを取得
    pub async fn list_task_lists(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskList>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let task_lists = document.load_data::<Vec<TaskList>>("task_lists").await?;
        if let Some(task_lists) = task_lists {
            Ok(task_lists)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでタスクリストを取得
    pub async fn get_task_list(
        &self,
        project_id: &ProjectId,
        task_list_id: &str,
    ) -> Result<Option<TaskList>, RepositoryError> {
        let task_lists = self.list_task_lists(project_id).await?;
        Ok(task_lists
            .into_iter()
            .find(|tl| tl.id == task_list_id.into()))
    }

    /// タスクリストを作成または更新
    pub async fn set_task_list(
        &self,
        project_id: &ProjectId,
        task_list: &TaskList,
    ) -> Result<(), RepositoryError> {
        let mut task_lists = self.list_task_lists(project_id).await?;

        // 既存のタスクリストを更新、または新規追加
        if let Some(existing) = task_lists.iter_mut().find(|tl| tl.id == task_list.id) {
            *existing = task_list.clone();
        } else {
            task_lists.push(task_list.clone());
        }

        let document = self.get_or_create_document(project_id).await?;
        document
            .save_data("task_lists", &task_lists)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// タスクリストを削除
    pub async fn delete_task_list(
        &self,
        project_id: &ProjectId,
        task_list_id: &str,
    ) -> Result<bool, RepositoryError> {
        let mut task_lists = self.list_task_lists(project_id).await?;
        let initial_len = task_lists.len();
        task_lists.retain(|tl| tl.id != task_list_id.into());

        if task_lists.len() != initial_len {
            let document = self.get_or_create_document(project_id).await?;
            document.save_data("task_lists", &task_lists).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// Repository<TaskList, TaskListId> トレイトの実装
impl TaskListRepositoryTrait for TaskListLocalAutomergeRepository {}

#[async_trait]
impl ProjectRepository<TaskList, TaskListId> for TaskListLocalAutomergeRepository {
    async fn save(&self, project_id: &ProjectId, entity: &TaskList) -> Result<(), RepositoryError> {
        self.set_task_list(project_id, entity).await
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &TaskListId,
    ) -> Result<Option<TaskList>, RepositoryError> {
        self.get_task_list(project_id, &id.to_string()).await
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<TaskList>, RepositoryError> {
        self.list_task_lists(project_id).await
    }

    async fn delete(&self, project_id: &ProjectId, id: &TaskListId) -> Result<(), RepositoryError> {
        let deleted = self.delete_task_list(project_id, &id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "TaskList not found: {}",
                id
            )))
        }
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        id: &TaskListId,
    ) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(project_id, id).await?;
        Ok(found.is_some())
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let task_lists = self.find_all(project_id).await?;
        Ok(task_lists.len() as u64)
    }
}

impl TaskListLocalAutomergeRepository {
    /// Automergeドキュメントの変更履歴を段階的にJSONで出力
    pub async fn export_task_list_changes_history<P: AsRef<std::path::Path>>(
        &self,
        project_id: &ProjectId,
        output_dir: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        document
            .export_document_changes_history(&output_dir, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }

    /// JSON出力機能：現在のタスクリスト状態をファイルにエクスポート
    pub async fn export_task_list_state<P: AsRef<std::path::Path>>(
        &self,
        project_id: &ProjectId,
        output_path: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        document
            .export_json(&output_path, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }
}
