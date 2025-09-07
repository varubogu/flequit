use flequit_model::models::accounts::account::{Account, PartialAccount};
use flequit_model::types::id_types::AccountId;
use flequit_types::errors::service_error::ServiceError;
use flequit_infrastructure::InfrastructureRepositories;
use crate::services::account_service;

#[tracing::instrument(level = "trace")]
pub async fn create_account(account: &Account) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match account_service::create_account(&repositories, account).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create account: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_account(id: &AccountId) -> Result<Option<Account>, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match account_service::get_account(&repositories, id).await {
        Ok(Some(account)) => Ok(Some(account)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get account: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_account(
    account_id: &AccountId,
    patch: &PartialAccount,
) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match account_service::update_account(&repositories, account_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update account: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn delete_account(id: &AccountId) -> Result<bool, String> {
    let repositories = InfrastructureRepositories::instance().await;
    match account_service::delete_account(&repositories, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete account: {:?}", e)),
    }
}
