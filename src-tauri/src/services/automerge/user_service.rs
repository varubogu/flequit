use std::sync::Arc;
use crate::repositories::automerge::user_repository::{UserRepository, UserRepositoryTrait};
use crate::types::User;
use crate::errors::ServiceError;
use chrono::Utc;

pub struct UserService {
    user_repo: Arc<UserRepository>,
}

impl UserService {
    pub fn new(user_repo: Arc<UserRepository>) -> Self {
        Self { user_repo }
    }
    
    pub async fn create_user(
        &self,
        name: String,
        email: String,
        avatar_url: Option<String>,
    ) -> Result<User, ServiceError> {
        // 入力検証
        if name.trim().is_empty() {
            return Err(ServiceError::ValidationError("User name cannot be empty".to_string()));
        }
        
        if name.len() > 100 {
            return Err(ServiceError::ValidationError("User name too long".to_string()));
        }
        
        if email.trim().is_empty() {
            return Err(ServiceError::ValidationError("Email cannot be empty".to_string()));
        }
        
        // 簡易メール形式チェック
        if !email.contains('@') {
            return Err(ServiceError::ValidationError("Invalid email format".to_string()));
        }
        
        let user = User {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.trim().to_string(),
            email: email.trim().to_lowercase(),
            avatar_url,
            created_at: Utc::now().timestamp_millis(),
            updated_at: Utc::now().timestamp_millis(),
        };
        
        self.user_repo.create(&user).await?;
        
        Ok(user)
    }
    
    pub async fn get_user(&self, user_id: &str) -> Result<Option<User>, ServiceError> {
        if user_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("User ID cannot be empty".to_string()));
        }
        
        self.user_repo.get(user_id).await
    }
    
    pub async fn list_users(&self) -> Result<Vec<User>, ServiceError> {
        self.user_repo.list().await
    }
    
    pub async fn update_user(
        &self,
        user_id: &str,
        name: Option<String>,
        email: Option<String>,
        avatar_url: Option<String>,
    ) -> Result<User, ServiceError> {
        let mut user = self.user_repo.get(user_id).await?
            .ok_or_else(|| ServiceError::NotFound("User not found".to_string()))?;
        
        // 名前更新
        if let Some(new_name) = name {
            if new_name.trim().is_empty() {
                return Err(ServiceError::ValidationError("User name cannot be empty".to_string()));
            }
            if new_name.len() > 100 {
                return Err(ServiceError::ValidationError("User name too long".to_string()));
            }
            user.name = new_name.trim().to_string();
        }
        
        // メール更新
        if let Some(new_email) = email {
            if new_email.trim().is_empty() {
                return Err(ServiceError::ValidationError("Email cannot be empty".to_string()));
            }
            if !new_email.contains('@') {
                return Err(ServiceError::ValidationError("Invalid email format".to_string()));
            }
            user.email = new_email.trim().to_lowercase();
        }
        
        // アバターURL更新
        if let Some(new_avatar_url) = avatar_url {
            user.avatar_url = Some(new_avatar_url);
        }
        
        user.updated_at = Utc::now().timestamp_millis();
        
        self.user_repo.update(&user).await?;
        
        Ok(user)
    }
    
    pub async fn delete_user(&self, user_id: &str) -> Result<(), ServiceError> {
        // ユーザー存在確認
        self.user_repo.get(user_id).await?
            .ok_or_else(|| ServiceError::NotFound("User not found".to_string()))?;
        
        // TODO: 関連データの削除や参照の更新を検討
        
        self.user_repo.delete(user_id).await?;
        
        Ok(())
    }
}