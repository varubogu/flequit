use crate::services::account_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::accounts::account::{Account, PartialAccount};
use flequit_model::types::id_types::{AccountId, UserId};
use flequit_types::errors::service_error::ServiceError;

pub async fn create_account<R>(repositories: &R, account: &Account, user_id: &UserId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match account_service::create_account(repositories, account, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create account: {:?}", e)),
    }
}

pub async fn get_account<R>(repositories: &R, id: &AccountId) -> Result<Option<Account>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match account_service::get_account(repositories, id).await {
        Ok(Some(account)) => Ok(Some(account)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get account: {:?}", e)),
    }
}

pub async fn update_account<R>(
    repositories: &R,
    account_id: &AccountId,
    patch: &PartialAccount,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match account_service::update_account(repositories, account_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update account: {:?}", e)),
    }
}

pub async fn delete_account<R>(repositories: &R, id: &AccountId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match account_service::delete_account(repositories, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete account: {:?}", e)),
    }
}
