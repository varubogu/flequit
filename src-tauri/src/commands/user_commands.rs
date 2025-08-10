use serde::{Serialize, Deserialize};
use crate::types::user_types::User;
use crate::services::user_service::UserService;
use crate::services::repository_service::{get_repositories, get_repository_searcher};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub success: bool,
    pub data: Option<User>,
    pub message: Option<String>,
}

#[tauri::command]
pub async fn create_user(user: User) -> Result<UserResponse, String> {
    let user_service = UserService;
    let mut repos = get_repositories();
    match user_service.create_user(&mut repos, &user).await {
        Ok(_) => Ok(UserResponse { success: true, data: Some(user), message: Some("User created".to_string()) }),
        Err(e) => Ok(UserResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn get_user(user_id: String) -> Result<UserResponse, String> {
    let user_service = UserService;
    let repo = get_repository_searcher();
    match user_service.get_user(&*repo, &user_id).await {
        Ok(user) => Ok(UserResponse { success: true, data: user, message: Some("User found".to_string()) }),
        Err(e) => Ok(UserResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn get_user_by_email(email: String) -> Result<UserResponse, String> {
    let user_service = UserService;
    let repo = get_repository_searcher();
    match user_service.get_user_by_email(&*repo, &email).await {
        Ok(user) => Ok(UserResponse { success: true, data: user, message: Some("User found".to_string()) }),
        Err(e) => Ok(UserResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn list_users() -> Result<Vec<User>, String> {
    let user_service = UserService;
    let repo = get_repository_searcher();
    user_service.list_users(&*repo).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_user(user: User) -> Result<UserResponse, String> {
    let user_service = UserService;
    let mut repos = get_repositories();
    match user_service.update_user(&mut repos, &user).await {
        Ok(_) => Ok(UserResponse { success: true, data: Some(user), message: Some("User updated".to_string()) }),
        Err(e) => Ok(UserResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn delete_user(user_id: String) -> Result<bool, String> {
    let user_service = UserService;
    let mut repos = get_repositories();
    user_service.delete_user(&mut repos, &user_id).await.map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_users(query: String) -> Result<Vec<User>, String> {
    let user_service = UserService;
    let repo = get_repository_searcher();
    user_service.search_users(&*repo, &query).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_email_exists(email: String, exclude_id: Option<String>) -> Result<bool, String> {
    let user_service = UserService;
    let repo = get_repository_searcher();
    user_service.is_email_exists(&*repo, &email, exclude_id.as_deref()).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_user_profile(user_id: String, display_name: Option<String>, avatar_url: Option<String>) -> Result<UserResponse, String> {
    let user_service = UserService;
    let mut repos = get_repositories();
    match user_service.update_user_profile(&mut repos, &user_id, &display_name, &avatar_url).await {
        Ok(_) => Ok(UserResponse { success: true, data: None, message: Some("Profile updated".to_string()) }),
        Err(e) => Ok(UserResponse { success: false, data: None, message: Some(e.to_string()) }),
    }
}

#[tauri::command]
pub async fn change_password(user_id: String, new_password_hash: String) -> Result<bool, String> {
    let user_service = UserService;
    let mut repos = get_repositories();
    user_service.change_password(&mut repos, &user_id, &new_password_hash).await.map(|_| true).map_err(|e| e.to_string())
}