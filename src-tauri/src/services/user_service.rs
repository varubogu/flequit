use crate::types::user_types::User;
use crate::repositories::core::CoreRepositoryTrait;
use crate::errors::service_error::ServiceError;

pub struct UserService;

impl UserService {
    pub async fn create_user(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        user: &User,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_user(user).await?;
        }
        Ok(())
    }

    pub async fn get_user(
        &self,
        repository: &dyn CoreRepositoryTrait,
        user_id: &str,
    ) -> Result<Option<User>, ServiceError> {
        Ok(repository.get_user(user_id).await?)
    }

    pub async fn get_user_by_email(
        &self,
        repository: &dyn CoreRepositoryTrait,
        email: &str,
    ) -> Result<Option<User>, ServiceError> {
        Ok(repository.find_user_by_email(email).await?)
    }

    pub async fn list_users(
        &self,
        repository: &dyn CoreRepositoryTrait,
    ) -> Result<Vec<User>, ServiceError> {
        Ok(repository.list_users().await?)
    }

    pub async fn update_user(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        user: &User,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.set_user(user).await?;
        }
        Ok(())
    }

    pub async fn delete_user(
        &self,
        repositories: &mut [Box<dyn CoreRepositoryTrait>],
        user_id: &str,
    ) -> Result<(), ServiceError> {
        for repo in repositories {
            repo.delete_user(user_id).await?;
        }
        Ok(())
    }

    pub async fn search_users(
        &self,
        repository: &dyn CoreRepositoryTrait,
        query: &str,
    ) -> Result<Vec<User>, ServiceError> {
        let users = repository.list_users().await?;
        let q = query.to_lowercase();
        let filtered = users
            .into_iter()
            .filter(|u| {
                u.name.to_lowercase().contains(&q)
                    || u.email.to_lowercase().contains(&q)
                    || u.display_name.as_deref().unwrap_or("").to_lowercase().contains(&q)
            })
            .collect();
        Ok(filtered)
    }

    pub async fn is_email_exists(
        &self,
        _repository: &dyn CoreRepositoryTrait,
        _email: &str,
        _exclude_id: Option<&str>,
    ) -> Result<bool, ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }

    pub async fn update_user_profile(
        &self,
        _repositories: &mut [Box<dyn CoreRepositoryTrait>],
        _user_id: &str,
        _display_name: &Option<String>,
        _avatar_url: &Option<String>,
    ) -> Result<(), ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }

    pub async fn change_password(
        &self,
        _repositories: &mut [Box<dyn CoreRepositoryTrait>],
        _user_id: &str,
        _new_password_hash: &str,
    ) -> Result<(), ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }
}