use crate::models::user::User;
use crate::errors::service_error::ServiceError;

#[allow(dead_code)]
pub struct UserService;

#[allow(dead_code)]
impl UserService {
    pub async fn create_user(
        &self,
        user: &User,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = user;
        Ok(())
    }

    pub async fn get_user(
        &self,
        user_id: &str,
    ) -> Result<Option<User>, ServiceError> {
        // 一時的にNoneを返す
        let _ = user_id;
        Ok(None)
    }

    pub async fn get_user_by_email(
        &self,
        email: &str,
    ) -> Result<Option<User>, ServiceError> {
        // 一時的にNoneを返す
        let _ = email;
        Ok(None)
    }

    pub async fn list_users(
        &self,
    ) -> Result<Vec<User>, ServiceError> {
        // 一時的に空のVecを返す
        Ok(Vec::new())
    }

    pub async fn update_user(
        &self,
        user: &User,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = user;
        Ok(())
    }

    pub async fn delete_user(
        &self,
        user_id: &str,
    ) -> Result<(), ServiceError> {
        // 一時的に何もしない
        let _ = user_id;
        Ok(())
    }

    pub async fn search_users(
        &self,
        query: &str,
    ) -> Result<Vec<User>, ServiceError> {
        // 一時的に空のVecを返す
        let _ = query;
        Ok(Vec::new())
    }

    pub async fn is_email_exists(
        &self,
        _email: &str,
        _exclude_id: Option<&str>,
    ) -> Result<bool, ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }

    pub async fn update_user_profile(
        &self,
        _user_id: &str,
        _display_name: &Option<String>,
        _avatar_url: &Option<String>,
    ) -> Result<(), ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }

    pub async fn change_password(
        &self,
        _user_id: &str,
        _new_password_hash: &str,
    ) -> Result<(), ServiceError> {
        Err(ServiceError::InternalError("Temporarily disabled".to_string()))
    }
}
