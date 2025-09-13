use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use flequit_model::models::task_projects::subtask::SubTask;
use flequit_model::types::id_types::{ProjectId, SubTaskId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::subtask_repository_trait::SubTaskRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
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
/// SubTaskLocalAutomergeRepository (このクラス)
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
pub struct SubTaskLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl SubTaskLocalAutomergeRepository {

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
        let doc_type = DocumentType::Project(project_id.clone());
        let mut manager = self.document_manager.lock().await;
        manager
            .get_or_create(&doc_type)
            .await
            .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
    }

    /// 指定されたプロジェクトの全サブタスクを取得

    pub async fn list_subtasks(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<SubTask>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let subtasks = document.load_data::<Vec<SubTask>>("subtasks").await?;
        if let Some(subtasks) = subtasks {
            Ok(subtasks)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでサブタスクを取得

    pub async fn get_subtask(
        &self,
        project_id: &ProjectId,
        subtask_id: &str,
    ) -> Result<Option<SubTask>, RepositoryError> {
        let subtasks = self.list_subtasks(project_id).await?;
        Ok(subtasks.into_iter().find(|st| st.id == subtask_id.into()))
    }

    /// サブタスクを作成または更新

    pub async fn set_subtask(
        &self,
        project_id: &ProjectId,
        subtask: &SubTask,
    ) -> Result<(), RepositoryError> {
        log::info!("set_subtask - 開始: {:?}", subtask.id);
        let mut subtasks = self.list_subtasks(project_id).await?;
        log::info!("set_subtask - 現在のサブタスク数: {}", subtasks.len());

        // 既存のサブタスクを更新、または新規追加
        if let Some(existing) = subtasks.iter_mut().find(|st| st.id == subtask.id) {
            log::info!("set_subtask - 既存サブタスクを更新: {:?}", subtask.id);
            *existing = subtask.clone();
        } else {
            log::info!("set_subtask - 新規サブタスク追加: {:?}", subtask.id);
            subtasks.push(subtask.clone());
        }

        let document = self.get_or_create_document(project_id).await?;
        log::info!("set_subtask - Document取得完了");
        let result = document.save_data("subtasks", &subtasks).await;
        match result {
            Ok(_) => {
                log::info!("set_subtask - Automergeドキュメント保存完了");
                Ok(())
            }
            Err(e) => {
                log::error!("set_subtask - Automergeドキュメント保存エラー: {:?}", e);
                Err(RepositoryError::AutomergeError(e.to_string()))
            }
        }
    }

    /// サブタスクを削除

    pub async fn delete_subtask(
        &self,
        project_id: &ProjectId,
        subtask_id: &str,
    ) -> Result<bool, RepositoryError> {
        let mut subtasks = self.list_subtasks(project_id).await?;
        let initial_len = subtasks.len();
        subtasks.retain(|st| st.id != subtask_id.into());

        if subtasks.len() != initial_len {
            let document = self.get_or_create_document(project_id).await?;
            document.save_data("subtasks", &subtasks).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// SubTaskRepositoryTraitの実装
#[async_trait]
impl SubTaskRepositoryTrait for SubTaskLocalAutomergeRepository {}

#[async_trait]
impl ProjectRepository<SubTask, SubTaskId> for SubTaskLocalAutomergeRepository {

    async fn save(&self, project_id: &ProjectId, entity: &SubTask) -> Result<(), RepositoryError> {
        log::info!(
            "SubTaskLocalAutomergeRepository::save - 開始: {:?}",
            entity.id
        );
        let result = self.set_subtask(project_id, entity).await;
        if result.is_ok() {
            log::info!(
                "SubTaskLocalAutomergeRepository::save - 完了: {:?}",
                entity.id
            );
        } else {
            log::error!(
                "SubTaskLocalAutomergeRepository::save - エラー: {:?}",
                result
            );
        }
        result
    }


    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &SubTaskId,
    ) -> Result<Option<SubTask>, RepositoryError> {
        self.get_subtask(project_id, &id.to_string()).await
    }


    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTask>, RepositoryError> {
        self.list_subtasks(project_id).await
    }


    async fn delete(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<(), RepositoryError> {
        let deleted = self.delete_subtask(project_id, &id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!(
                "SubTask not found: {}",
                id
            )))
        }
    }


    async fn exists(
        &self,
        project_id: &ProjectId,
        id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(project_id, id).await?;
        Ok(found.is_some())
    }


    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let subtasks = self.find_all(project_id).await?;
        Ok(subtasks.len() as u64)
    }
}
