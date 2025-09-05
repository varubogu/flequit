use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::task_projects::task::Task;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::task_repository_trait::TaskRepositoryTrait;
use flequit_model::types::id_types::{ProjectId, TaskId};
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;

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
/// DocumentManager (プロジェクトごとのドキュメント管理)
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
/// - **ステートレス**: プロジェクトIDは必要時に引数で受け取る
#[derive(Debug)]
pub struct TaskLocalAutomergeRepository {
    document_manager: Arc<tokio::sync::RwLock<DocumentManager>>,
}

impl TaskLocalAutomergeRepository {
    #[tracing::instrument(level = "trace")]
    pub async fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(tokio::sync::RwLock::new(document_manager)),
        })
    }

    /// 指定されたプロジェクトのDocumentを取得または作成
    #[tracing::instrument(level = "trace")]
    async fn get_or_create_document(&self, project_id: &ProjectId) -> Result<Document, RepositoryError> {
        let doc_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.write().await;
        manager.get_or_create(&doc_type).await.map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 指定されたプロジェクトの全タスクを取得
    #[tracing::instrument(level = "trace")]
    pub async fn list_tasks(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let tasks = document.load_data::<Vec<Task>>("tasks").await?;
        if let Some(tasks) = tasks {
            Ok(tasks)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでタスクを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_task(&self, project_id: &ProjectId, task_id: &str) -> Result<Option<Task>, RepositoryError> {
        let tasks = self.list_tasks(project_id).await?;
        Ok(tasks.into_iter().find(|t| t.id == task_id.into()))
    }

    /// タスクを作成または更新
    #[tracing::instrument(level = "trace")]
    pub async fn set_task(&self, project_id: &ProjectId, task: &Task) -> Result<(), RepositoryError> {
        log::info!("set_task - 開始: {:?}", task.id);
        let mut tasks = self.list_tasks(project_id).await?;
        log::info!("set_task - 現在のタスク数: {}", tasks.len());

        // 既存のタスクを更新、または新規追加
        if let Some(existing) = tasks.iter_mut().find(|t| t.id == task.id) {
            log::info!("set_task - 既存タスクを更新: {:?}", task.id);
            *existing = task.clone();
        } else {
            log::info!("set_task - 新規タスク追加: {:?}", task.id);
            tasks.push(task.clone());
        }

        let document = self.get_or_create_document(project_id).await?;
        log::info!("set_task - Document取得完了");
        let result = document.save_data("tasks", &tasks).await;
        match result {
            Ok(_) => {
                log::info!("set_task - Automergeドキュメント保存完了");
                Ok(())
            },
            Err(e) => {
                log::error!("set_task - Automergeドキュメント保存エラー: {:?}", e);
                Err(RepositoryError::AutomergeError(e.to_string()))
            }
        }
    }

    /// タスクを削除
    #[tracing::instrument(level = "trace")]
    pub async fn delete_task(&self, project_id: &ProjectId, task_id: &str) -> Result<bool, RepositoryError> {
        let mut tasks = self.list_tasks(project_id).await?;
        let initial_len = tasks.len();
        tasks.retain(|t| t.id != task_id.into());

        if tasks.len() != initial_len {
            let document = self.get_or_create_document(project_id).await?;
            document.save_data("tasks", &tasks).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// TaskRepositoryTraitの実装
#[async_trait]
impl TaskRepositoryTrait for TaskLocalAutomergeRepository {}

#[async_trait]
impl ProjectRepository<Task, TaskId> for TaskLocalAutomergeRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, project_id: &ProjectId, entity: &Task) -> Result<(), RepositoryError> {
        log::info!("TaskLocalAutomergeRepository::save - 開始: {:?}", entity.id);
        let result = self.set_task(project_id, entity).await;
        if result.is_ok() {
            log::info!("TaskLocalAutomergeRepository::save - 完了: {:?}", entity.id);
        } else {
            log::error!("TaskLocalAutomergeRepository::save - エラー: {:?}", result);
        }
        result
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, project_id: &ProjectId, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        self.get_task(project_id, &id.to_string()).await
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError> {
        self.list_tasks(project_id).await
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, project_id: &ProjectId, id: &TaskId) -> Result<(), RepositoryError> {
        let deleted = self.delete_task(project_id, &id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!("Task not found: {}", id)))
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, project_id: &ProjectId, id: &TaskId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(project_id, id).await?;
        Ok(found.is_some())
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let tasks = self.find_all(project_id).await?;
        Ok(tasks.len() as u64)
    }
}
