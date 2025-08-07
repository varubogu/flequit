use async_trait::async_trait;
use std::sync::Arc;
use crate::infrastructure::automerge_service::AutomergeRepoService;
use crate::types::Tag;
use crate::errors::RepositoryError;

#[async_trait]
pub trait TagRepositoryTrait {
    async fn create(&self, tag: &Tag) -> Result<(), RepositoryError>;
    async fn get(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError>;
    async fn list(&self) -> Result<Vec<Tag>, RepositoryError>;
    async fn update(&self, tag: &Tag) -> Result<(), RepositoryError>;
    async fn delete(&self, tag_id: &str) -> Result<(), RepositoryError>;
}

pub struct TagRepository {
    automerge_service: Arc<AutomergeRepoService>,
}

impl TagRepository {
    pub fn new(automerge_service: Arc<AutomergeRepoService>) -> Self {
        Self { automerge_service }
    }
}

#[async_trait]
impl TagRepositoryTrait for TagRepository {
    async fn create(&self, tag: &Tag) -> Result<(), RepositoryError> {
        self.automerge_service.set_tag(tag).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn get(&self, tag_id: &str) -> Result<Option<Tag>, RepositoryError> {
        self.automerge_service.get_tag(tag_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn list(&self) -> Result<Vec<Tag>, RepositoryError> {
        self.automerge_service.list_tags().await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn update(&self, tag: &Tag) -> Result<(), RepositoryError> {
        self.automerge_service.set_tag(tag).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn delete(&self, _tag_id: &str) -> Result<(), RepositoryError> {
        // TODO: タグ削除機能の実装
        Ok(())
    }
}