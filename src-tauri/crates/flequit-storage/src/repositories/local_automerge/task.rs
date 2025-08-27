use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use crate::models::task::Task;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::task_repository_trait::TaskRepositoryTrait;
use crate::types::id_types::TaskId;
use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automerge実装のタスクリポジトリ
///
/// `Repository<Task>`と`TaskRepositoryTrait`を実装し、
/// Automerge-Repoを使用したタスク管理を提供する。
///
/// # アーキテクチャ
///
/// ```text
/// LocalAutomergeTaskRepository (このクラス)
///   | 委譲
/// InnerTasksRepository (既存の実装)
///   | データアクセス
/// Automerge Documents
/// ```
///
/// # 特徴
///
/// - **分散同期**: CRDTによる競合解決機能
/// - **履歴管理**: すべての変更履歴を保持
/// - **オフライン対応**: ローカル優先で同期可能
/// - **JSON互換**: 構造化データの効率的な管理
#[derive(Debug)]
pub struct TaskLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TaskLocalAutomergeRepository {
    /// 新しいTaskRepositoryを作成
    #[tracing::instrument(level = "trace")]
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全タスクを取得
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
    pub async fn get_task(&self, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        let tasks = self.list_tasks().await?;
        Ok(tasks.into_iter().find(|t| t.id == task_id.into()))
    }

    /// タスクを作成または更新
    #[tracing::instrument(level = "trace")]
    pub async fn set_task(&self, task: &Task) -> Result<(), RepositoryError> {
        log::info!("set_task - 開始: {:?}", task.id);
        let mut tasks = self.list_tasks().await?;
        log::info!("set_task - 現在のタスク数: {}", tasks.len());

        // 既存のタスクを更新、または新規追加
        if let Some(existing) = tasks.iter_mut().find(|t| t.id == task.id) {
            log::info!("set_task - 既存タスクを更新: {:?}", task.id);
            *existing = task.clone();
        } else {
            log::info!("set_task - 新規タスク追加: {:?}", task.id);
            tasks.push(task.clone());
        }

        {
            let mut manager = self.document_manager.lock().await;
            log::info!("set_task - DocumentManager取得完了");
            let result = manager
                .save_data(&DocumentType::Settings, "tasks", &tasks)
                .await;
            if result.is_ok() {
                log::info!("set_task - Automergeドキュメント保存完了");
            } else {
                log::error!("set_task - Automergeドキュメント保存エラー: {:?}", result);
            }
            result
        }
    }

    /// タスクを削除
    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
    async fn save(&self, entity: &Task) -> Result<(), RepositoryError> {
        log::info!("TaskLocalAutomergeRepository::save - 開始: {:?}", entity.id);
        let result = self.set_task(entity).await;
        if result.is_ok() {
            log::info!("TaskLocalAutomergeRepository::save - 完了: {:?}", entity.id);
        } else {
            log::error!("TaskLocalAutomergeRepository::save - エラー: {:?}", result);
        }
        result
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        self.get_task(&id.to_string()).await
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self) -> Result<Vec<Task>, RepositoryError> {
        self.list_tasks().await
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError> {
        let deleted = self.delete_task(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!("Task not found: {}", id)))
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, id: &TaskId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self) -> Result<u64, RepositoryError> {
        let tasks = self.find_all().await?;
        Ok(tasks.len() as u64)
    }
}

impl TaskLocalAutomergeRepository {
    /// JSON出力機能：タスク変更履歴をエクスポート
    #[tracing::instrument(level = "trace", skip(output_dir))]
    pub async fn export_task_changes_history<P: AsRef<Path>>(
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

    /// JSON出力機能：現在のタスク状態をファイルにエクスポート
    #[tracing::instrument(level = "trace", skip(file_path))]
    pub async fn export_task_state<P: AsRef<Path>>(
        &self,
        file_path: P,
        description: Option<&str>,
    ) -> Result<(), RepositoryError> {
        let mut manager = self.document_manager.lock().await;
        manager
            .export_document_to_file(&DocumentType::Settings, &file_path, description)
            .await
            .map_err(|e| RepositoryError::Export(e.to_string()))
    }
}
