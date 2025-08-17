use crate::models::account::Account;
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::AccountId;
use async_trait::async_trait;

#[async_trait]
pub trait AccountRepositoryTrait: Repository<Account, AccountId> + Send + Sync {}
