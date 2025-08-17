use crate::errors::service_error::ServiceError;
use crate::models::account::Account;
use crate::services::account_service;
use crate::types::id_types::AccountId;

pub async fn create_account(account: &Account) -> Result<bool, String> {
    match account_service::create_account(account).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create account: {:?}", e)),
    }
}

pub async fn get_account(id: &AccountId) -> Result<Option<Account>, String> {
    match account_service::get_account(id).await {
        Ok(Some(account)) => Ok(Some(account)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get account: {:?}", e)),
    }
}

pub async fn update_account(account: &Account) -> Result<bool, String> {
    match account_service::update_account(account).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update account: {:?}", e)),
    }
}

pub async fn delete_account(id: &AccountId) -> Result<bool, String> {
    match account_service::delete_account(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete account: {:?}", e)),
    }
}
