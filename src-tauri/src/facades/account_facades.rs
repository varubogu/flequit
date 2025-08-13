use crate::models::account_models::Account;

pub async fn create_account(account: &Account) -> Result<bool, String> {
    Ok(true)
}

pub async fn get_account(id: &str) -> Result<Option<Account>, String> {
    Ok(None)
}

pub async fn update_account(account: &Account) -> Result<bool, String> {
    Ok(true)
}

pub async fn delete_account(id: &str) -> Result<bool, String> {
    Ok(true)
}
