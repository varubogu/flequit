use flequit_model::models::user::User;
use flequit_model::types::id_types::UserId;
use crate::errors::service_error::ServiceError;
use crate::services::user_service;

#[tracing::instrument(level = "trace")]
pub async fn create_user(user: &User) -> Result<bool, String> {
    match user_service::create_user(user).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create user: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_user(id: &UserId) -> Result<Option<User>, String> {
    match user_service::get_user(id).await {
        Ok(Some(user)) => Ok(Some(user)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn update_user(user: &User) -> Result<bool, String> {
    match user_service::update_user(user).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update user: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn delete_user(id: &UserId) -> Result<bool, String> {
    match user_service::delete_user(id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete user: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn list_users() -> Result<Vec<User>, String> {
    match user_service::list_users().await {
        Ok(users) => Ok(users),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to list users: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn get_user_by_email(email: &str) -> Result<Option<User>, String> {
    match user_service::get_user_by_email(email).await {
        Ok(Some(user)) => Ok(Some(user)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user by email: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn search_users(query: &str) -> Result<Vec<User>, String> {
    match user_service::search_users(query).await {
        Ok(users) => Ok(users),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to search users: {:?}", e)),
    }
}

#[tracing::instrument(level = "trace")]
pub async fn is_email_exists(email: &str, exclude_id: Option<&str>) -> Result<bool, String> {
    match user_service::is_email_exists(email, exclude_id).await {
        Ok(exists) => Ok(exists),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to check email existence: {:?}", e)),
    }
}