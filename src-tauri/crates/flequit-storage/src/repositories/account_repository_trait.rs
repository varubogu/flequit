use async_trait::async_trait;
use flequit_model::models::account::Account;
use flequit_model::types::id_types::AccountId;
use crate::repositories::base_repository_trait::Repository;

#[async_trait]
pub trait AccountRepositoryTrait: Repository<Account, AccountId> + Send + Sync {}
