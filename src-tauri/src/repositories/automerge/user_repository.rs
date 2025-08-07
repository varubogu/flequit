use async_trait::async_trait;
use std::sync::Arc;
use crate::infrastructure::automerge_service::AutomergeRepoService;
use crate::types::User;
use crate::errors::RepositoryError;

#[async_trait]
pub trait UserRepositoryTrait {
    async fn create(&self, user: &User) -> Result<(), RepositoryError>;
    async fn get(&self, user_id: &str) -> Result<Option<User>, RepositoryError>;
    async fn list(&self) -> Result<Vec<User>, RepositoryError>;
    async fn update(&self, user: &User) -> Result<(), RepositoryError>;
    async fn delete(&self, user_id: &str) -> Result<(), RepositoryError>;
}

pub struct UserRepository {
    automerge_service: Arc<AutomergeRepoService>,
}

impl UserRepository {
    pub fn new(automerge_service: Arc<AutomergeRepoService>) -> Self {
        Self { automerge_service }
    }
}

#[async_trait]
impl UserRepositoryTrait for UserRepository {
    async fn create(&self, user: &User) -> Result<(), RepositoryError> {
        self.automerge_service.set_user(user).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn get(&self, user_id: &str) -> Result<Option<User>, RepositoryError> {
        self.automerge_service.get_user(user_id).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn list(&self) -> Result<Vec<User>, RepositoryError> {
        // TODO: ユーザー一覧機能の実装
        Ok(vec![])
    }
    
    async fn update(&self, user: &User) -> Result<(), RepositoryError> {
        self.automerge_service.set_user(user).await
            .map_err(|e| RepositoryError::AutomergeError(e))
    }
    
    async fn delete(&self, _user_id: &str) -> Result<(), RepositoryError> {
        // TODO: ユーザー削除機能の実装
        Ok(())
    }
}