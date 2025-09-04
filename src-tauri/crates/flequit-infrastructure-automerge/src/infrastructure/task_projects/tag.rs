use crate::infrastructure::document::Document;

use super::super::document_manager::{DocumentManager, DocumentType};
use flequit_model::models::task_projects::tag::Tag;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::tag_repository_trait::TagRepositoryTrait;
use flequit_model::types::id_types::{ProjectId, TagId};
use async_trait::async_trait;
use flequit_types::errors::repository_error::RepositoryError;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Tag用のAutomerge-Repoリポジトリ
#[derive(Debug)]
pub struct TagLocalAutomergeRepository {
    document: Document,
}

impl TagLocalAutomergeRepository {
    /// 新しいTagRepositoryを作成
    pub async fn new(base_path: PathBuf, project_id: ProjectId) -> Result<Self, RepositoryError> {
        let doc_type = &DocumentType::Project(project_id);
        let mut document_manager = DocumentManager::new(base_path)?;
        let doc = document_manager.get_or_create(doc_type).await?;
        Ok(Self {
            document: doc,
        })
    }

    /// 共有DocumentManagerを使用して新しいインスタンスを作成
    pub async fn new_with_manager(
        document_manager: Arc<Mutex<DocumentManager>>,
        project_id: ProjectId
    ) -> Result<Self, RepositoryError> {
        let doc_type = &DocumentType::Project(project_id);
        let doc = {
            let mut manager = document_manager.lock().await;
            manager.get_or_create(doc_type).await?
        };
        Ok(Self {
            document: doc,
        })
    }

    /// 全タグを取得
    pub async fn list_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        let tags = {
            self.document
                .load_data::<Vec<Tag>>("tags")
                .await?
        };
        if let Some(tags) = tags {
            Ok(tags)
        } else {
            Ok(Vec::new())
        }
    }

    /// IDでタグを取得
    pub async fn get_tag(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        let tags = self.list_tags().await?;
        Ok(tags.into_iter().find(|t| t.id == tag_id.into()))
    }

    /// タグを作成または更新
    pub async fn set_tag(&self, tag: &Tag) -> Result<(), RepositoryError> {
        let mut tags = self.list_tags().await?;

        // 既存のタグを更新、または新規追加
        if let Some(existing) = tags.iter_mut().find(|t| t.id == tag.id) {
            *existing = tag.clone();
        } else {
            tags.push(tag.clone());
        }

        {
            let doc = &self.document;
            doc
                .save_data("tags", &tags)
                .await
                .map_err(|e| RepositoryError::AutomergeError(e.to_string()))
        }
    }

    /// タグを削除
    pub async fn delete_tag(&self, tag_id: &str) -> Result<bool, RepositoryError> {
        let mut tags = self.list_tags().await?;
        let initial_len = tags.len();
        tags.retain(|t| t.id != tag_id.into());

        if tags.len() != initial_len {
            {
                let doc = &self.document;
                doc
                    .save_data("tags", &tags)
                    .await?
            };
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

// Repository<Tag, TagId> トレイトの実装
impl TagRepositoryTrait for TagLocalAutomergeRepository {}

#[async_trait]
impl Repository<Tag, TagId> for TagLocalAutomergeRepository {
    async fn save(&self, entity: &Tag) -> Result<(), RepositoryError> {
        self.set_tag(entity).await
    }

    async fn find_by_id(&self, id: &TagId) -> Result<Option<Tag>, RepositoryError> {
        self.get_tag(&id.to_string()).await
    }

    async fn find_all(&self) -> Result<Vec<Tag>, RepositoryError> {
        self.list_tags().await
    }

    async fn delete(&self, id: &TagId) -> Result<(), RepositoryError> {
        let deleted = self.delete_tag(&id.to_string()).await?;
        if deleted {
            Ok(())
        } else {
            Err(RepositoryError::NotFound(format!("Tag not found: {}", id)))
        }
    }

    async fn exists(&self, id: &TagId) -> Result<bool, RepositoryError> {
        let found = self.find_by_id(id).await?;
        Ok(found.is_some())
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let tags = self.find_all().await?;
        Ok(tags.len() as u64)
    }
}
