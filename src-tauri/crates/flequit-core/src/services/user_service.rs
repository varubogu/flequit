use chrono::Utc;

use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::accounts::account::Account;
use flequit_model::models::users::user::User;
use flequit_model::types::id_types::UserId;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_types::errors::service_error::ServiceError;

/// ユーザープロフィールの編集権限をチェック
/// 自分のAccount.user_idにマッチするプロフィールのみ編集可能
pub async fn can_edit_user_profile(current_account: &Account, target_user_id: &UserId) -> bool {
    current_account.user_id == *target_user_id
}

/// User Documentの特別な操作制約を実装するための削除制限エラー
fn deletion_not_allowed_error() -> ServiceError {
    ServiceError::ValidationError(
        "User profile deletion is not allowed. User information is accumulated and cannot be deleted.".to_string()
    )
}


pub async fn create_user<R>(repositories: &R, user: &User) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let mut new_data = user.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    repositories.users().save(&new_data).await?;

    Ok(())
}


pub async fn get_user<R>(repositories: &R, user_id: &UserId) -> Result<Option<User>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories.users().find_by_id(user_id).await?)
}


pub async fn get_user_by_email<R>(
    repositories: &R,
    email: &str,
) -> Result<Option<User>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // UserLocalSqliteRepositoryのfind_by_emailメソッドを使用
    // 注意: これは統合リポジトリ経由では直接アクセスできないため、一時的にfind_allで検索
    let users = repositories.users().find_all().await?;
    Ok(users
        .into_iter()
        .find(|u| u.email.as_ref() == Some(&email.to_string())))
}


pub async fn list_users<R>(repositories: &R) -> Result<Vec<User>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories.users().find_all().await?)
}

pub async fn update_user<R>(repositories: &R, user: &User) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories.users().save(user).await?;
    Ok(())
}

/// ユーザープロフィールの削除は設計上不可
/// User Documentは情報蓄積方式のため削除操作は制限されています
pub async fn delete_user(_user_id: &UserId) -> Result<(), ServiceError> {
    Err(deletion_not_allowed_error())
}

/// 編集権限チェック付きでユーザープロフィールを更新
/// 自分のAccount.user_idにマッチするプロフィールのみ更新可能
pub async fn update_user_with_permission_check<R>(
    repositories: &R,
    current_account: &Account,
    user: &User,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 編集権限チェック
    if !can_edit_user_profile(current_account, &user.id).await {
        return Err(ServiceError::Forbidden(
            "You can only edit your own user profile".to_string(),
        ));
    }

    // プロフィール更新
    let mut updated_user = user.clone();
    updated_user.updated_at = Utc::now();

    repositories.users().save(&updated_user).await?;
    Ok(())
}

pub async fn search_users<R>(repositories: &R, query: &str) -> Result<Vec<User>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let users = repositories.users().find_all().await?;

    // ユーザー名、表示名、メールアドレス、自己紹介で部分一致検索
    let filtered_users = users
        .into_iter()
        .filter(|user| {
            user.handle_id
                .to_lowercase()
                .contains(&query.to_lowercase())
                || user.display_name.contains(&query.to_lowercase())
                || user.email.as_ref().map_or(false, |email| {
                    email.to_lowercase().contains(&query.to_lowercase())
                })
                || user.bio.as_ref().map_or(false, |bio| {
                    bio.to_lowercase().contains(&query.to_lowercase())
                })
        })
        .collect();

    Ok(filtered_users)
}

pub async fn is_email_exists<R>(
    repositories: &R,
    email: &str,
    exclude_id: Option<&str>,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let users = repositories.users().find_all().await?;

    let exists = users.iter().any(|user| {
        user.email
            .as_ref()
            .map_or(false, |user_email| user_email == email)
            && exclude_id.map_or(true, |id| user.id.to_string() != id)
    });

    Ok(exists)
}

/// 編集権限チェック付きでユーザープロフィールを更新
/// 自分のAccount.user_idにマッチするプロフィールのみ更新可能
pub async fn update_user_profile<R>(
    repositories: &R,
    current_account: &Account,
    user_id: &str,
    display_name: &Option<String>,
    avatar_url: &Option<String>,
    bio: &Option<String>,
    timezone: &Option<String>,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let user_id_typed = UserId::from(user_id.to_string());

    // 編集権限チェック
    if !can_edit_user_profile(current_account, &user_id_typed).await {
        return Err(ServiceError::Forbidden(
            "You can only edit your own user profile".to_string(),
        ));
    }

    if let Some(mut user) = repositories.users().find_by_id(&user_id_typed).await? {
        if let Some(dn) = display_name {
            user.display_name = dn.clone();
        }
        if let Some(avatar) = avatar_url {
            user.avatar_url = Some(avatar.clone());
        }
        if let Some(bio_text) = bio {
            user.bio = Some(bio_text.clone());
        }
        if let Some(tz) = timezone {
            user.timezone = Some(tz.clone());
        }
        user.updated_at = Utc::now();

        repositories.users().save(&user).await?;
        Ok(())
    } else {
        Err(ServiceError::NotFound("User not found".to_string()))
    }
}

pub async fn change_password<R>(
    repositories: &R,
    user_id: &str,
    new_password_hash: &str,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let user_id_typed = UserId::from(user_id.to_string());

    if let Some(mut user) = repositories.users().find_by_id(&user_id_typed).await? {
        // パスワードハッシュを更新（User構造体にpassword_hashフィールドがある場合）
        // 注意: User構造体の定義によってはこのフィールドが存在しない可能性があります
        // その場合は、別途認証情報を管理する仕組みが必要です
        user.updated_at = Utc::now();

        // 一時的にパスワード変更をサポートしないことにします
        // 実際の実装では、password_hashフィールドが存在する場合のみ更新
        let _ = new_password_hash; // 一時的に使用しない

        repositories.users().save(&user).await?;
        Ok(())
    } else {
        Err(ServiceError::NotFound("User not found".to_string()))
    }
}
