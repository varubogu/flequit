use crate::errors::ServiceError;
use crate::types::user_types::User;
use crate::repositories::automerge::UserRepository;
use tauri::State;

pub struct UserService;

impl UserService {
    pub fn new() -> Self {
        Self
    }

    // ユーザー操作
    pub async fn create_user(&self, user_repository: State<'_, UserRepository>, user: &User) -> Result<(), ServiceError> {
        todo!("Implementation pending - use user_repository")
    }

    pub async fn get_user(&self, user_repository: State<'_, UserRepository>, user_id: &str) -> Result<Option<User>, ServiceError> {
        todo!("Implementation pending - use user_repository")
    }

    pub async fn get_user_by_email(&self, user_repository: State<'_, UserRepository>, email: &str) -> Result<Option<User>, ServiceError> {
        todo!("Implementation pending - use user_repository")
    }

    pub async fn update_user(&self, user_repository: State<'_, UserRepository>, user: &User) -> Result<(), ServiceError> {
        todo!("Implementation pending - use user_repository")
    }

    pub async fn delete_user(&self, user_repository: State<'_, UserRepository>, user_id: &str) -> Result<(), ServiceError> {
        todo!("Implementation pending - use user_repository")
    }

    pub async fn list_users(&self, user_repository: State<'_, UserRepository>) -> Result<Vec<User>, ServiceError> {
        todo!("Implementation pending - use user_repository")
    }

    // ユーザー検索
    pub async fn search_users(&self, user_repository: State<'_, UserRepository>, query: &str) -> Result<Vec<User>, ServiceError> {
        todo!("Implementation pending - search by name or email using user_repository")
    }

    pub async fn list_users_by_project(&self, user_repository: State<'_, UserRepository>, project_id: &str) -> Result<Vec<User>, ServiceError> {
        todo!("Implementation pending - get users who are members of the project using user_repository")
    }

    // ビジネスロジック
    pub async fn validate_user(&self, user_repository: State<'_, UserRepository>, user: &User) -> Result<(), ServiceError> {
        if user.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("User name cannot be empty".to_string()));
        }

        if user.name.len() > 100 {
            return Err(ServiceError::ValidationError("User name too long".to_string()));
        }

        if user.email.trim().is_empty() {
            return Err(ServiceError::ValidationError("Email cannot be empty".to_string()));
        }

        if !self.is_valid_email(&user.email) {
            return Err(ServiceError::ValidationError("Invalid email format".to_string()));
        }

        // メールアドレスの重複チェック
        if self.is_email_exists(user_repository, &user.email, Some(&user.id)).await? {
            return Err(ServiceError::ValidationError("Email already exists".to_string()));
        }

        Ok(())
    }

    pub async fn is_email_exists(&self, user_repository: State<'_, UserRepository>, email: &str, exclude_id: Option<&str>) -> Result<bool, ServiceError> {
        todo!("Implementation pending - check if email already exists using user_repository")
    }

    fn is_valid_email(&self, email: &str) -> bool {
        email.contains('@') && email.contains('.')
    }

    pub async fn update_avatar(&self, user_repository: State<'_, UserRepository>, user_id: &str, avatar_url: Option<String>) -> Result<(), ServiceError> {
        todo!("Implementation pending - use user_repository")
    }

    pub async fn change_password(&self, user_repository: State<'_, UserRepository>, user_id: &str, old_password: &str, new_password: &str) -> Result<(), ServiceError> {
        todo!("Implementation pending - password handling logic using user_repository")
    }
}
