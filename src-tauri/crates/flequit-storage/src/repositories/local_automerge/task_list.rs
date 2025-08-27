use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::task_list::TaskList;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::task_list_repository_trait::TaskListRepositoryTrait;
use crate::types::id_types::TaskListId;
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// TaskList用のAutomerge-Repoリポジトリ
#[derive(Debug)]
pub struct TaskListLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TaskListLocalAutomergeRepository {
    /// 新しいTaskListRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全タスクリストを取得
    pub async fn list_task_lists(&self) -> Result<Vec<TaskList>, RepositoryError> {
        let task_lists = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<TaskList>>(&DocumentType::Settings, "task_lists")
                .await?
        };
        if let Some(task_lists) = task_lists {
            Ok(task_lists)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでタスクリストを取得
    pub async fn get_task_list(
        &self,
        task_list_id: &str,
    ) -> Result<Option<TaskList>, RepositoryError> {
        let task_lists = self.list_task_lists().await?;
        Ok(task_lists
            .into_iter()
            .find(|tl| tl.id == task_list_id.into()))
    }

    /// タスクリストを作成または更新
    pub async fn set_task_list(&self, task_list: &TaskList) -> Result<(), RepositoryError> {
        let mut task_lists = self.list_task_lists().await?;

        // 既存のタスクリストを更新、または新規追加
        if let Some(existing) = task_lists.iter_mut().find(|tl| tl.id == task_list.id) {
            *existing = task_list.clone();
        } else {
            task_lists.push(task_list.clone());
        }

        {
            let mut manager = self.document_manager.lock().await;
            manager
                .save_data(&DocumentType::Settings, "task_lists", &task_lists)
                .await
        }
    }

    /// タスクリストを削除
    pub async fn delete_task_list(&self, task_list_id: &str) -> Result<bool, RepositoryError> {
        let mut task_lists = self.list_task_lists().await?;
        let initial_len = task_lists.len();
        task_lists.retain(|tl| tl.id != task_list_id.into());

        if task_lists.len() != initial_len {
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Settings, "task_lists", &task_lists)
                    .await?
            };
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// Repository<TaskList, TaskListId> トレイトの実装
impl TaskListRepositoryTrait for TaskListLocalAutomergeRepository {}

#[async_trait]
impl Repository<TaskList, TaskListId> for TaskListLocalAutomergeRepository {
    async fn save(&self, entity: &TaskList) -> Result<(), RepositoryError> {
        self.set_task_list(entity).await
    }

    async fn find_by_id(&self, id: &TaskListId) -> Result<Option<TaskList>, RepositoryError> {
        self.get_task_list(&id.to_string()).await
    }

    async fn find_all(&self) -> Result<Vec<TaskList>, RepositoryError> {
        self.list_task_lists().await
    }

    async fn delete(&self, id: &TaskListId) -> Result<(), RepositoryError> {
        let deleted = self.delete_task_list(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "TaskList not found: {}",
                id
            )))
        }
    }

    async fn exists(&self, id: &TaskListId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let task_lists = self.find_all().await?;
        Ok(task_lists.len() as u64)
    }
}

impl TaskListLocalAutomergeRepository {
    /// Automergeドキュメントの変更履歴を段階的にJSONで出力
    pub async fn export_task_list_changes_history<P: AsRef<std::path::Path>>(
        &self,
        output_dir: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        manager
            .export_document_changes_history(&DocumentType::Settings, &output_dir, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }

    /// JSON出力機能：現在のタスクリスト状態をファイルにエクスポート
    pub async fn export_task_list_state<P: AsRef<std::path::Path>>(
        &self,
        output_path: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        manager
            .export_document_to_file(&DocumentType::Settings, &output_path, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }
}
