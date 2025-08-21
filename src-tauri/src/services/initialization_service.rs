use crate::errors::service_error::ServiceError;
use crate::models::account::Account;
use crate::models::command::initialize::InitializedResult;
use crate::models::project::Project;
use crate::models::setting::{LocalSettings, Settings};
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::setting_repository_trait::SettingRepositoryTrait;
use crate::repositories::Repositories;

pub async fn load_all_data() -> Result<InitializedResult, ServiceError> {
    // 他のservice関数を組み合わせて全データを取得
    let local_settings = load_local_settings().await?;
    let accounts = load_all_account().await?;
    let projects = load_all_project_data().await?;

    // LocalSettingsからSettingsを構築
    let mut settings = Settings::default();
    if let Some(local_settings) = local_settings {
        settings.theme = local_settings.theme;
        settings.language = local_settings.language;
    }

    Ok(InitializedResult {
        settings,
        accounts,
        projects,
    })
}

pub async fn load_local_settings() -> Result<Option<LocalSettings>, ServiceError> {
    let repository = Repositories::new().await?;

    // ローカル設定取得ロジック：設定データベースから取得
    let key_value_settings = repository
        .settings
        .get_all_key_value_settings()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    let local_settings = LocalSettings {
        theme: key_value_settings
            .get("theme")
            .unwrap_or(&"system".to_string())
            .clone(),
        language: key_value_settings
            .get("language")
            .unwrap_or(&"ja".to_string())
            .clone(),
    };

    Ok(Some(local_settings))
}

pub async fn load_current_account() -> Result<Option<Account>, ServiceError> {
    let repository = Repositories::new().await?;

    // 現在のアカウント取得ロジック：アクティブなアカウントを探す
    // まずアクティブなアカウントがあるかチェック
    let accounts = repository
        .accounts
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    // is_activeフラグがtrueのアカウントを優先して返す
    let active_account = accounts.iter().find(|account| account.is_active).cloned();

    if active_account.is_some() {
        Ok(active_account)
    } else {
        // アクティブなアカウントがない場合は、最新のアカウントを返す
        let mut sorted_accounts = accounts;
        sorted_accounts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(sorted_accounts.into_iter().next())
    }
}

pub async fn load_all_project_data() -> Result<Vec<Project>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .projects
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}

pub async fn load_all_account() -> Result<Vec<Account>, ServiceError> {
    let repository = Repositories::new().await?;
    repository
        .accounts
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))
}
