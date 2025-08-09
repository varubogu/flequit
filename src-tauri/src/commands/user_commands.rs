use serde::{Serialize, Deserialize};
use tauri::State;
use crate::types::user_types::User;
use crate::services::automerge::UserService;
use crate::repositories::automerge::UserRepository;
use chrono::Utc;


#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub success: bool,
    pub data: Option<User>,
    pub message: Option<String>,
}

// ユーザー作成
#[tauri::command]
pub async fn create_user(
    user: User,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<UserResponse, String> {
    println!("create_user called");
    println!("user: {:?}", user);

    // サービス層を呼び出し
    match user_service.create_user(user_repository, &user).await {
        Ok(_) => {
            let res = UserResponse {
                success: true,
                data: Some(user),
                message: Some("User created successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = UserResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// ユーザー取得
#[tauri::command]
pub async fn get_user(
    user_id: String,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<UserResponse, String> {
    println!("get_user called");
    println!("user_id: {:?}", user_id);

    // サービス層を呼び出し
    match user_service.get_user(user_repository, &user_id).await {
        Ok(user) => {
            let res = UserResponse {
                success: true,
                data: user,
                message: Some("User retrieved successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = UserResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// メールアドレスでユーザー取得
#[tauri::command]
pub async fn get_user_by_email(
    email: String,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<UserResponse, String> {
    println!("get_user_by_email called");
    println!("email: {:?}", email);

    // サービス層を呼び出し
    match user_service.get_user_by_email(user_repository, &email).await {
        Ok(user) => {
            let res = UserResponse {
                success: true,
                data: user,
                message: Some("User retrieved successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = UserResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// ユーザー一覧取得
#[tauri::command]
pub async fn list_users(
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<Vec<User>, String> {
    println!("list_users called");

    // サービス層を呼び出し
    match user_service.list_users(user_repository).await {
        Ok(users) => Ok(users),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// ユーザー更新
#[tauri::command]
pub async fn update_user(
    user: User,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<UserResponse, String> {
    println!("update_user called");
    println!("user: {:?}", user);

    // サービス層を呼び出し
    match user_service.update_user(user_repository, &user).await {
        Ok(_) => {
            let res = UserResponse {
                success: true,
                data: Some(user),
                message: Some("User updated successfully".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = UserResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// ユーザー削除
#[tauri::command]
pub async fn delete_user(
    user_id: String,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<bool, String> {
    println!("delete_user called");
    println!("user_id: {:?}", user_id);

    // サービス層を呼び出し
    match user_service.delete_user(user_repository, &user_id).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// ユーザー検索
#[tauri::command]
pub async fn search_users(
    query: String,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<Vec<User>, String> {
    println!("search_users called");
    println!("query: {:?}", query);

    // サービス層を呼び出し
    match user_service.search_users(user_repository, &query).await {
        Ok(users) => Ok(users),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// プロジェクトメンバー検索
#[tauri::command]
pub async fn search_project_members(
    project_id: String,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<Vec<User>, String> {
    println!("search_project_members called");
    println!("project_id: {:?}", project_id);

    // サービス層を呼び出し
    match user_service.search_users(user_repository, &project_id).await {
        Ok(users) => Ok(users),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// メールアドレスの重複チェック
#[tauri::command]
pub async fn check_email_exists(
    email: String,
    exclude_id: Option<String>,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<bool, String> {
    println!("check_email_exists called");
    println!("email: {:?}, exclude_id: {:?}", email, exclude_id);

    // サービス層を呼び出し
    match user_service.is_email_exists(user_repository, &email, exclude_id.as_deref()).await {
        Ok(exists) => Ok(exists),
        Err(service_error) => Err(service_error.to_string()),
    }
}

// プロフィール情報更新
#[tauri::command]
pub async fn update_user_profile(
    user_id: String,
    display_name: Option<String>,
    avatar_url: Option<String>,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<UserResponse, String> {
    println!("update_user_profile called");
    println!("user_id: {:?}", user_id);

    // 既存のユーザーを取得
    match user_service.get_user(user_repository.clone(), &user_id).await {
        Ok(Some(mut existing_user)) => {
            // コマンド引数をservice形式に変換
            if let Some(display_name) = display_name {
                existing_user.display_name = Some(display_name);
            }
            if let Some(avatar_url) = avatar_url {
                existing_user.avatar_url = Some(avatar_url);
            }

            existing_user.updated_at = Utc::now();

            // サービス層を呼び出し
            match user_service.update_avatar(user_repository, &user_id, Option::from(existing_user.avatar_url.clone())).await {
                Ok(_) => {
                    let res = UserResponse {
                        success: true,
                        data: Some(existing_user),
                        message: Some("User profile updated successfully".to_string()),
                    };
                    Ok(res)
                }
                Err(service_error) => {
                    let res = UserResponse {
                        success: false,
                        data: None,
                        message: Some(service_error.to_string()),
                    };
                    Ok(res)
                }
            }
        }
        Ok(None) => {
            let res = UserResponse {
                success: false,
                data: None,
                message: Some("User not found".to_string()),
            };
            Ok(res)
        }
        Err(service_error) => {
            let res = UserResponse {
                success: false,
                data: None,
                message: Some(service_error.to_string()),
            };
            Ok(res)
        }
    }
}

// パスワード変更（将来の認証機能用）
#[tauri::command]
pub async fn change_password(
    user_id: String,
    old_password: String,
    new_password: String,
    user_service: State<'_, UserService>,
    user_repository: State<'_, UserRepository>,
) -> Result<bool, String> {
    println!("change_password called");
    println!("user_id: {:?}", user_id);

    // サービス層を呼び出し
    match user_service.change_password(user_repository, &user_id, &old_password, &new_password).await {
        Ok(_) => Ok(true),
        Err(service_error) => Err(service_error.to_string()),
    }
}
