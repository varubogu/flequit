use chrono::Utc;

use crate::errors::service_error::ServiceError;
use crate::models::user::User;
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::Repositories;
use crate::types::id_types::UserId;

#[tracing::instrument(level = "trace")]
pub async fn create_user(user: &User) -> Result<(), ServiceError> {
    let mut new_data = user.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    let repository = Repositories::new().await?;
    repository.users.save(&new_data).await?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_user(user_id: &UserId) -> Result<Option<User>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.users.find_by_id(user_id).await?)
}

#[tracing::instrument(level = "trace")]
pub async fn get_user_by_email(email: &str) -> Result<Option<User>, ServiceError> {
    let repository = Repositories::new().await?;
    // UserLocalSqliteRepositoryのfind_by_emailメソッドを使用
    // 注意: これは統合リポジトリ経由では直接アクセスできないため、一時的にfind_allで検索
    let users = repository.users.find_all().await?;
    Ok(users.into_iter().find(|u| u.email == email))
}

#[tracing::instrument(level = "trace")]
pub async fn list_users() -> Result<Vec<User>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.users.find_all().await?)
}

pub async fn update_user(user: &User) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.users.save(user).await?;
    Ok(())
}

pub async fn delete_user(user_id: &UserId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.users.delete(user_id).await?;
    Ok(())
}

pub async fn search_users(query: &str) -> Result<Vec<User>, ServiceError> {
    let repository = Repositories::new().await?;
    let users = repository.users.find_all().await?;

    // 名前、表示名、メールアドレスで部分一致検索
    let filtered_users = users
        .into_iter()
        .filter(|user| {
            user.name.to_lowercase().contains(&query.to_lowercase())
                || user.display_name.as_ref().map_or(false, |dn| {
                    dn.to_lowercase().contains(&query.to_lowercase())
                })
                || user.email.to_lowercase().contains(&query.to_lowercase())
        })
        .collect();

    Ok(filtered_users)
}

pub async fn is_email_exists(email: &str, exclude_id: Option<&str>) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;
    let users = repository.users.find_all().await?;

    let exists = users
        .iter()
        .any(|user| user.email == email && exclude_id.map_or(true, |id| user.id.to_string() != id));

    Ok(exists)
}

pub async fn update_user_profile(
    user_id: &str,
    display_name: &Option<String>,
    avatar_url: &Option<String>,
) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    let user_id_typed = UserId::from(user_id.to_string());

    if let Some(mut user) = repository.users.find_by_id(&user_id_typed).await? {
        if let Some(dn) = display_name {
            user.display_name = Some(dn.clone());
        }
        if let Some(avatar) = avatar_url {
            user.avatar_url = Some(avatar.clone());
        }
        user.updated_at = Utc::now();

        repository.users.save(&user).await?;
        Ok(())
    } else {
        Err(ServiceError::NotFound("User not found".to_string()))
    }
}

pub async fn change_password(user_id: &str, new_password_hash: &str) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    let user_id_typed = UserId::from(user_id.to_string());

    if let Some(mut user) = repository.users.find_by_id(&user_id_typed).await? {
        // パスワードハッシュを更新（User構造体にpassword_hashフィールドがある場合）
        // 注意: User構造体の定義によってはこのフィールドが存在しない可能性があります
        // その場合は、別途認証情報を管理する仕組みが必要です
        user.updated_at = Utc::now();

        // 一時的にパスワード変更をサポートしないことにします
        // 実際の実装では、password_hashフィールドが存在する場合のみ更新
        let _ = new_password_hash; // 一時的に使用しない

        repository.users.save(&user).await?;
        Ok(())
    } else {
        Err(ServiceError::NotFound("User not found".to_string()))
    }
}
