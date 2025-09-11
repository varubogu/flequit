//! ユーザー用統合リポジトリ

use async_trait::async_trait;
use flequit_repository::patchable_trait::Patchable;
use flequit_types::errors::repository_error::RepositoryError;
use flequit_repository::repositories::users::user_repository_trait::UserRepositoryTrait;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_model::models::users::User;
use flequit_model::types::id_types::UserId;

#[derive(Debug)]
pub struct UserUnifiedRepository {
    // 最小限実装
}

impl Default for UserUnifiedRepository {
    fn default() -> Self {
        Self {}
    }
}

impl UserUnifiedRepository {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl Repository<User, UserId> for UserUnifiedRepository {
    async fn save(&self, _entity: &User) -> Result<(), RepositoryError> { Ok(()) }
    async fn find_by_id(&self, _id: &UserId) -> Result<Option<User>, RepositoryError> { Ok(None) }
    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> { Ok(vec![]) }
    async fn delete(&self, _id: &UserId) -> Result<(), RepositoryError> { Ok(()) }
    async fn exists(&self, _id: &UserId) -> Result<bool, RepositoryError> { Ok(false) }
    async fn count(&self) -> Result<u64, RepositoryError> { Ok(0) }
}

impl UserRepositoryTrait for UserUnifiedRepository {}

#[async_trait]
impl Patchable<User, UserId> for UserUnifiedRepository {}
