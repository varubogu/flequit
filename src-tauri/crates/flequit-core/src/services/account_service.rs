use chrono::Utc;

use flequit_types::errors::service_error::ServiceError;
use flequit_model::models::accounts::account::{Account, PartialAccount};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::types::id_types::AccountId;

#[tracing::instrument(level = "trace")]
pub async fn create_account(repositories: &dyn InfrastructureRepositoriesTrait, account: &Account) -> Result<(), ServiceError> {
    let mut new_data = account.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    repositories.accounts().save(&new_data).await?;

    Ok(())
}

#[tracing::instrument(level = "trace")]
pub async fn get_account(repositories: &dyn InfrastructureRepositoriesTrait, account_id: &AccountId) -> Result<Option<Account>, ServiceError> {
    Ok(repositories.accounts().find_by_id(account_id).await?)
}

#[tracing::instrument(level = "trace")]
pub async fn update_account(
    _repositories: &dyn InfrastructureRepositoriesTrait,
    _account_id: &AccountId,
    _patch: &PartialAccount,
) -> Result<bool, ServiceError> {
    // TODO: Infrastructure層にpatchメソッドが実装されたら有効化
    Err(ServiceError::InternalError("Account patch method is not implemented".to_string()))
}

#[tracing::instrument(level = "trace")]
pub async fn delete_account(repositories: &dyn InfrastructureRepositoriesTrait, account_id: &AccountId) -> Result<(), ServiceError> {
    repositories.accounts().delete(account_id).await?;
    Ok(())
}
