use crate::services::user_service;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::users::user::User;
use flequit_model::types::id_types::UserId;
use flequit_types::errors::service_error::ServiceError;

pub async fn create_user<R>(repositories: &R, user: &User, user_id: &UserId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::create_user(repositories, user, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to create user: {:?}", e)),
    }
}

pub async fn get_user<R>(repositories: &R, id: &UserId) -> Result<Option<User>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::get_user(repositories, id).await {
        Ok(Some(user)) => Ok(Some(user)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user: {:?}", e)),
    }
}

pub async fn update_user<R>(repositories: &R, user: &User, user_id: &UserId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::update_user(repositories, user, user_id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update user: {:?}", e)),
    }
}

pub async fn delete_user<R>(repositories: &R, id: &UserId) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::delete_user(repositories, id).await {
        Ok(_) => Ok(true),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to delete user: {:?}", e)),
    }
}

pub async fn list_users<R>(repositories: &R) -> Result<Vec<User>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::list_users(repositories).await {
        Ok(users) => Ok(users),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to list users: {:?}", e)),
    }
}

pub async fn get_user_by_email<R>(repositories: &R, email: &str) -> Result<Option<User>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::get_user_by_email(repositories, email).await {
        Ok(Some(user)) => Ok(Some(user)),
        Ok(None) => Ok(None),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to get user by email: {:?}", e)),
    }
}

pub async fn search_users<R>(repositories: &R, query: &str) -> Result<Vec<User>, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::search_users(repositories, query).await {
        Ok(users) => Ok(users),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to search users: {:?}", e)),
    }
}

pub async fn is_email_exists<R>(
    repositories: &R,
    email: &str,
    exclude_id: Option<&str>,
) -> Result<bool, String>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    match user_service::is_email_exists(repositories, email, exclude_id).await {
        Ok(exists) => Ok(exists),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to check email existence: {:?}", e)),
    }
}
