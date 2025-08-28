use super::document_manager::{DocumentManager, DocumentType};
use crate::errors::RepositoryError;
use flequit_model::models::tag::Tag;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::tag_repository_trait::TagRepositoryTrait;
use flequit_model::types::id_types::TagId;
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Tag用のAutomerge-Repoリポジトリ
#[derive(Debug)]
pub struct TagLocalAutomergeRepository {
    document_manager: Arc<Mutex<DocumentManager>>,
}

impl TagLocalAutomergeRepository {
    /// 新しいTagRepositoryを作成
    pub fn new(base_path: PathBuf) -> Result<Self, RepositoryError> {
        let document_manager = DocumentManager::new(base_path)?;
        Ok(Self {
            document_manager: Arc::new(Mutex::new(document_manager)),
        })
    }

    /// 全タグを取得
    pub async fn list_tags(&self) -> Result<Vec<Tag>, RepositoryError> {
        let tags = {
            let mut manager = self.document_manager.lock().await;
            manager
                .load_data::<Vec<Tag>>(&DocumentType::Settings, "tags")
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
            let mut manager = self.document_manager.lock().await;
            manager
                .save_data(&DocumentType::Settings, "tags", &tags)
                .await
        }
    }

    /// タグを削除
    pub async fn delete_tag(&self, tag_id: &str) -> Result<bool, RepositoryError> {
        let mut tags = self.list_tags().await?;
        let initial_len = tags.len();
        tags.retain(|t| t.id != tag_id.into());

        if tags.len() != initial_len {
            {
                let mut manager = self.document_manager.lock().await;
                manager
                    .save_data(&DocumentType::Settings, "tags", &tags)
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

impl TagLocalAutomergeRepository {
    /// Automergeドキュメントの変更履歴を段階的にJSONで出力
    pub async fn export_tag_changes_history<P: AsRef<std::path::Path>>(
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

    /// JSON出力機能：現在のタグ状態をファイルにエクスポート
    pub async fn export_tag_state<P: AsRef<std::path::Path>>(
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
