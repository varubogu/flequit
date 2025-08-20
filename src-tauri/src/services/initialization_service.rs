use crate::errors::service_error::ServiceError;
use crate::models::account::Account;
use crate::models::command::initialize::InitializedResult;
use crate::models::project::Project;
use crate::models::setting::{LocalSettings, Settings};
use crate::repositories::base_repository_trait::Repository;
use crate::repositories::Repositories;

pub async fn load_all_data() -> Result<InitializedResult, ServiceError> {
    let repository = Repositories::new().await?;

    let settings = Settings::default(); // TODO: 実際の設定取得ロジック
    let accounts = repository
        .accounts
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    let projects = repository
        .projects
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;

    Ok(InitializedResult {
        settings,
        accounts,
        projects,
    })
}

pub async fn load_local_settings() -> Result<Option<LocalSettings>, ServiceError> {
    // TODO: 実際のローカル設定取得ロジック
    Ok(Some(LocalSettings {
        theme: "system".to_string(),
        language: "ja".to_string(),
    }))
}

pub async fn load_current_account() -> Result<Option<Account>, ServiceError> {
    let repository = Repositories::new().await?;
    // TODO: 現在のアカウント取得ロジック
    // 最初のアカウントを返すか、None を返す
    let accounts = repository
        .accounts
        .find_all()
        .await
        .map_err(|e| ServiceError::InternalError(format!("Repository error: {:?}", e)))?;
    Ok(accounts.into_iter().next())
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
