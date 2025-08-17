use crate::errors::service_error::ServiceError;
use crate::models::account::Account;
use crate::types::id_types::AccountId;

pub async fn create_account(account: &Account) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = account;
    Ok(())
}

pub async fn get_account(account_id: &AccountId) -> Result<Option<Account>, ServiceError> {
    // 一時的にNoneを返す
    let _ = account_id;
    Ok(None)
}

pub async fn get_account_by_provider(
    provider: &str,
    provider_id: &str,
) -> Result<Option<Account>, ServiceError> {
    // 一時的にNoneを返す
    let _ = provider;
    let _ = provider_id;
    Ok(None)
}

pub async fn list_accounts() -> Result<Vec<Account>, ServiceError> {
    // 一時的に空のVecを返す
    Ok(Vec::new())
}

pub async fn update_account(account: &Account) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = account;
    Ok(())
}

pub async fn delete_account(account_id: &AccountId) -> Result<(), ServiceError> {
    // 一時的に何もしない
    let _ = account_id;
    Ok(())
}

pub async fn search_accounts(query: &str) -> Result<Vec<Account>, ServiceError> {
    // 一時的に空のVecを返す
    let _ = query;
    Ok(Vec::new())
}
