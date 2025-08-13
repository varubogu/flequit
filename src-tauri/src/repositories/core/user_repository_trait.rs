use crate::errors::RepositoryError;
use crate::models::user::User;
use async_trait::async_trait;

#[async_trait]
#[allow(dead_code)]
pub trait UserRepositoryTrait {
    async fn set_user(&self, user: &User) -> Result<(), RepositoryError>;

    async fn get_user(&self, user_id: &str) -> Result<Option<User>, RepositoryError>;

    async fn list_users(&self) -> Result<Vec<User>, RepositoryError>;

    async fn delete_user(&self, user_id: &str) -> Result<(), RepositoryError>;

    async fn find_user_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError>;

    async fn search_users_by_name(&self, name_pattern: &str) -> Result<Vec<User>, RepositoryError>;

    async fn search_users(&self, query: &str) -> Result<Vec<User>, RepositoryError>;

    async fn find_users_by_project(&self, project_id: &str) -> Result<Vec<User>, RepositoryError>;

    async fn find_project_owners(&self, project_id: &str) -> Result<Vec<User>, RepositoryError>;

    async fn update_avatar(&self, user_id: &str, avatar_url: Option<String>) -> Result<(), RepositoryError>;

    async fn update_name(&self, user_id: &str, name: &str) -> Result<(), RepositoryError>;

    async fn update_email(&self, user_id: &str, email: &str) -> Result<(), RepositoryError>;

    async fn validate_user_exists(&self, user_id: &str) -> Result<bool, RepositoryError>;

    async fn is_email_unique(&self, email: &str, exclude_id: Option<&str>) -> Result<bool, RepositoryError>;

    async fn validate_user_in_project(&self, user_id: &str, project_id: &str) -> Result<bool, RepositoryError>;

    async fn get_user_count(&self) -> Result<u64, RepositoryError>;

    async fn get_active_user_count(&self) -> Result<u64, RepositoryError>;

    async fn get_user_project_count(&self, user_id: &str) -> Result<u64, RepositoryError>;

    async fn get_user_task_count(&self, user_id: &str) -> Result<u64, RepositoryError>;
}
