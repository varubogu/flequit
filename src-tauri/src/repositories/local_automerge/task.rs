use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::task::Task;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::task_repository_trait::TaskRepositoryTrait;
use crate::types::id_types::TaskId;
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Task用のAutomerge-Repoリポジトリ
#[derive(Debug)]
pub struct TaskLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TaskLocalAutomergeRepository {
    /// 新しいTaskRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全タスクを取得
    pub async fn list_tasks(&self) -> Result<Vec<Task>, RepositoryError> {
        let tasks = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<Task>>(&DocumentType::Settings, "tasks")
                .await?
        };
        if let Some(tasks) = tasks {
            Ok(tasks)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでタスクを取得
    pub async fn get_task(&self, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        let tasks = self.list_tasks().await?;
        Ok(tasks.into_iter().find(|t| t.id == task_id.into()))
    }

    /// タスクを作成または更新
    pub async fn set_task(&self, task: &Task) -> Result<(), RepositoryError> {
        let mut tasks = self.list_tasks().await?;

        // 既存のタスクを更新、または新規追加
        if let Some(existing) = tasks.iter_mut().find(|t| t.id == task.id) {
            *existing = task.clone();
        } else {
            tasks.push(task.clone());
        }

        {
            let mut manager = self.document_manager.lock().await;
            manager
                .save_data(&DocumentType::Settings, "tasks", &tasks)
                .await
        }
    }

    /// タスクを削除
    pub async fn delete_task(&self, task_id: &str) -> Result<bool, RepositoryError> {
        let mut tasks = self.list_tasks().await?;
        let initial_len = tasks.len();
        tasks.retain(|t| t.id != task_id.into());

        if tasks.len() != initial_len {
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Settings, "tasks", &tasks)
                    .await?
            };
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// Repository<Task, TaskId> トレイトの実装
impl TaskRepositoryTrait for TaskLocalAutomergeRepository {}

#[async_trait]
impl Repository<Task, TaskId> for TaskLocalAutomergeRepository {
    async fn save(&self, entity: &Task) -> Result<(), RepositoryError> {
        self.set_task(entity).await
    }

    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        self.get_task(&id.to_string()).await
    }

    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        self.list_tasks().await
    }

    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError> {
        let deleted = self.delete_task(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!("Task not found: {}", id)))
        }
    }

    async fn exists(&self, id: &TaskId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let tasks = self.find_all().await?;
        Ok(tasks.len() as u64)
    }
}
