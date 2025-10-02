use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use async_trait::async_trait;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::types::id_types::{ProjectId, TagId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::tag_repository_trait::TagRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Automerge実装のタグリポジトリ
///
/// `Repository<Tag>`と`TagRepositoryTrait`を実装し、
/// Automerge-Repoを使用したタグ管理を提供する。
///
/// # アーキテクチャ
///
/// ```text
/// TagLocalAutomergeRepository (このクラス)
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
pub struct TagLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TagLocalAutomergeRepository {
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
        Ok(Self { document_manager })
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

    /// 指定されたプロジェクトの全タグを取得

    pub async fn list_tags(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        let document = self.get_or_create_document(project_id).await?;
        let tags = document.load_data::<Vec<Tag>>("tags").await?;
        if let Some(tags) = tags {
            Ok(tags)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでタグを取得

    pub async fn get_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &str,
    ) -> Result<Option<Tag>, RepositoryError> {
        let tags = self.list_tags(project_id).await?;
        Ok(tags.into_iter().find(|t| t.id == tag_id.into()))
    }

    /// タグを作成または更新

    pub async fn set_tag(&self, project_id: &ProjectId, tag: &Tag) -> Result<(), RepositoryError> {
        log::info!("set_tag - 開始: {:?}", tag.id);
        let mut tags = self.list_tags(project_id).await?;
        log::info!("set_tag - 現在のタグ数: {}", tags.len());

        // 既存のタグを更新、または新規追加
        if let Some(existing) = tags.iter_mut().find(|t| t.id == tag.id) {
            log::info!("set_tag - 既存タグを更新: {:?}", tag.id);
            *existing = tag.clone();
        } else {
            log::info!("set_tag - 新規タグ追加: {:?}", tag.id);
            tags.push(tag.clone());
        }

        let document = self.get_or_create_document(project_id).await?;
        log::info!("set_tag - Document取得完了");
        let result = document.save_data("tags", &tags).await;
        match result {
            Ok(_) => {
                log::info!("set_tag - Automergeドキュメント保存完了");
                Ok(())
            }
            Err(e) => {
                log::error!("set_tag - Automergeドキュメント保存エラー: {:?}", e);
                Err(RepositoryError::AutomergeError(e.to_string()))
            }
        }
    }

    /// タグを削除

    pub async fn delete_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &str,
    ) -> Result<bool, RepositoryError> {
        let mut tags = self.list_tags(project_id).await?;
        let initial_len = tags.len();
        tags.retain(|t| t.id != tag_id.into());

        if tags.len() != initial_len {
            let document = self.get_or_create_document(project_id).await?;
            document.save_data("tags", &tags).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// TagRepositoryTraitの実装
#[async_trait]
impl TagRepositoryTrait for TagLocalAutomergeRepository {}

#[async_trait]
impl ProjectRepository<Tag, TagId> for TagLocalAutomergeRepository {
    async fn save(&self, project_id: &ProjectId, entity: &Tag) -> Result<(), RepositoryError> {
        log::info!("TagLocalAutomergeRepository::save - 開始: {:?}", entity.id);
        let result = self.set_tag(project_id, entity).await;
        if result.is_ok() {
            log::info!("TagLocalAutomergeRepository::save - 完了: {:?}", entity.id);
        } else {
            log::error!("TagLocalAutomergeRepository::save - エラー: {:?}", result);
        }
        result
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &TagId,
    ) -> Result<Option<Tag>, RepositoryError> {
        self.get_tag(project_id, &id.to_string()).await
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        self.list_tags(project_id).await
    }

    async fn delete(&self, project_id: &ProjectId, id: &TagId) -> Result<(), RepositoryError> {
        let deleted = self.delete_tag(project_id, &id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!("Tag not found: {}", id)))
        }
    }

    async fn exists(&self, project_id: &ProjectId, id: &TagId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(project_id, id).await?;
        Ok(found.is_some())
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        let tags = self.find_all(project_id).await?;
        Ok(tags.len() as u64)
    }
}
