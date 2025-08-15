use log::info;

use crate::models::account::Account;
use crate::models::user::User;
use crate::services::user_service::UserService;
use crate::errors::service_error::ServiceError;
use crate::types::id_types::{AccountId, UserId};

pub async fn create_account(account: &Account) -> Result<bool, String> {

    // AccountモデルをUserモデルに変換してUserServiceを使用
    let user = User {
        id: UserId::from(*account.id.as_uuid()),
        name: account.display_name.clone().unwrap_or_else(|| "Unknown".to_string()),
        email: account.email.clone().unwrap_or_else(|| "unknown@example.com".to_string()),
        avatar_url: account.avatar_url.clone(),
        avatar: account.avatar_url.clone(),
        username: account.display_name.clone(),
        display_name: account.display_name.clone(),
        created_at: account.created_at,
        updated_at: account.updated_at,
    };

    let service = UserService;

    match service.create_user(&user).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create account: {:?}", e))
    }
}

pub async fn get_account(id: &str) -> Result<Option<Account>, String> {
    let service = UserService;

    match service.get_user(id).await {
        Ok(Some(user)) => {
            // UserモデルをAccountモデルに変換
            let account = crate::models::account::Account {
                id: AccountId::from(*user.id.as_uuid()),
                email: Some(user.email),
                display_name: user.display_name,
                avatar_url: user.avatar_url,
                provider: "local".to_string(),
                provider_id: None,
                is_active: true,
                created_at: user.created_at,
                updated_at: user.updated_at,
            };
            // AccountをAccountに変換して返却
            Ok(Some(account))
        },
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get account: {:?}", e))
    }
}

pub async fn update_account(account: &Account) -> Result<bool, String> {

    // AccountモデルをUserモデルに変換してUserServiceを使用
    let user = User {
        id: UserId::from(*account.id.as_uuid()),
        name: account.display_name.clone().unwrap_or_else(|| "Unknown".to_string()),
        email: account.email.clone().unwrap_or_else(|| "unknown@example.com".to_string()),
        avatar_url: account.avatar_url.clone(),
        avatar: account.avatar_url.clone(),
        username: account.display_name.clone(),
        display_name: account.display_name.clone(),
        created_at: account.created_at,
        updated_at: account.updated_at,
    };

    let service = UserService;

    match service.update_user(&user).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update account: {:?}", e))
    }
}

pub async fn delete_account(id: &str) -> Result<bool, String> {
    info!("delete_account called with id: {}", id);
    Ok(true)
}
