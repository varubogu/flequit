use crate::models::account_models::Account;
use log::info;

pub async fn create_account(account: &Account) -> Result<bool, String> {
    info!("create_account called with account: {:?}", account);
    Ok(true)
}

pub async fn get_account(id: &str) -> Result<Option<Account>, String> {
    info!("get_account called with id: {}", id);
    Ok(None)
}

pub async fn update_account(account: &Account) -> Result<bool, String> {
    info!("update_account called with account: {:?}", account);
    Ok(true)
}

pub async fn delete_account(id: &str) -> Result<bool, String> {
    info!("delete_account called with id: {}", id);
    Ok(true)
}
