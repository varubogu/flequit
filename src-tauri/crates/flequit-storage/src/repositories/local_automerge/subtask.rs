use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use flequit_model::models::subtask::SubTask;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::sub_task_repository_trait::SubTaskRepositoryTrait;
use flequit_model::types::id_types::SubTaskId;
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automerge実装のサブタスクリポジトリ
///
/// `Repository<SubTask>`と`SubTaskRepositoryTrait`を実装し、
/// Automerge-Repoを使用したサブタスク管理を提供する。
///
/// # アーキテクチャ
///
/// ```text
/// LocalAutomergeSubTaskRepository (このクラス)
///   | 委譲
/// InnerSubTasksRepository (既存の実装)
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
pub struct SubTaskLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SubTaskLocalAutomergeRepository {
    /// 新しいSubTaskRepositoryを作成
    #[tracing::instrument(level = "trace")]
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全サブタスクを取得
    #[tracing::instrument(level = "trace")]
    pub async fn list_subtasks(&self) -> Result<Vec<SubTask>, RepositoryError> {
        let subtasks = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<SubTask>>(&DocumentType::Settings, "subtasks")
                .await?
        };
        if let Some(subtasks) = subtasks {
            Ok(subtasks)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでサブタスクを取得
    #[tracing::instrument(level = "trace")]
    pub async fn get_subtask(&self, subtask_id: &str) -> Result<Option<SubTask>, RepositoryError> {
        let subtasks = self.list_subtasks().await?;
        Ok(subtasks.into_iter().find(|st| st.id == subtask_id.into()))
    }

    /// サブタスクを作成または更新
    pub async fn set_subtask(&self, subtask: &SubTask) -> Result<(), RepositoryError> {
        let mut subtasks = self.list_subtasks().await?;

        // 既存のサブタスクを更新、または新規追加
        if let Some(existing) = subtasks.iter_mut().find(|st| st.id == subtask.id) {
            *existing = subtask.clone();
        } else {
            subtasks.push(subtask.clone());
        }

        {
            let mut manager = self.document_manager.lock().await;
            manager
                .save_data(&DocumentType::Settings, "subtasks", &subtasks)
                .await
        }
    }

    /// サブタスクを削除
    pub async fn delete_subtask(&self, subtask_id: &str) -> Result<bool, RepositoryError> {
        let mut subtasks = self.list_subtasks().await?;
        let initial_len = subtasks.len();
        subtasks.retain(|st| st.id != subtask_id.into());

        if subtasks.len() != initial_len {
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Settings, "subtasks", &subtasks)
                    .await?
            };
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// Repository<SubTask, SubTaskId> トレイトの実装
impl SubTaskRepositoryTrait for SubTaskLocalAutomergeRepository {}

#[async_trait]
impl Repository<SubTask, SubTaskId> for SubTaskLocalAutomergeRepository {
    async fn save(&self, entity: &SubTask) -> Result<(), RepositoryError> {
        self.set_subtask(entity).await
    }

    async fn find_by_id(&self, id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        self.get_subtask(&id.to_string()).await
    }

    async fn find_all(&self) -> Result<Vec<SubTask>, RepositoryError> {
        self.list_subtasks().await
    }

    async fn delete(&self, id: &SubTaskId) -> Result<(), RepositoryError> {
        let deleted = self.delete_subtask(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "SubTask not found: {}",
                id
            )))
        }
    }

    async fn exists(&self, id: &SubTaskId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let subtasks = self.find_all().await?;
        Ok(subtasks.len() as u64)
    }
}

impl SubTaskLocalAutomergeRepository {
    /// Automergeドキュメントの変更履歴を段階的にJSONで出力
    pub async fn export_subtask_changes_history<P: AsRef<std::path::Path>>(
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

    /// JSON出力機能：現在のサブタスク状態をファイルにエクスポート
    pub async fn export_subtask_state<P: AsRef<std::path::Path>>(
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
