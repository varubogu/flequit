use chrono::Utc;

use crate::errors::service_error::ServiceError;
use crate::models::account::{Account, PartialAccount};
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::Repositories;
use crate::types::id_types::AccountId;

pub async fn create_account(account: &Account) -> Result<(), ServiceError> {
    let mut new_data = account.clone();
    let now = Utc::now();
    new_data.created_at = now;
    new_data.updated_at = now;

    let repository = Repositories::new().await?;
    repository.accounts.save(&new_data).await?;

    Ok(())
}

pub async fn get_account(account_id: &AccountId) -> Result<Option<Account>, ServiceError> {
    let repository = Repositories::new().await?;
    Ok(repository.accounts.find_by_id(account_id).await?)
}

pub async fn update_account(
    account_id: &AccountId,
    patch: &PartialAccount,
) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;

    // updated_atフィールドを自動設定したパッチを作成
    let mut updated_patch = patch.clone();
    updated_patch.updated_at = Some(Utc::now());

    let changed = repository
        .accounts
        .patch(account_id, &updated_patch)
        .await?;

    if !changed {
        // パッチ適用で変更がなかった場合、エンティティが存在するかチェック
        if repository.accounts.find_by_id(account_id).await?.is_none() {
            return Err(ServiceError::NotFound("Account not found".to_string()));
        }
    }

    Ok(changed)
}

pub async fn delete_account(account_id: &AccountId) -> Result<(), ServiceError> {
    let repository = Repositories::new().await?;
    repository.accounts.delete(account_id).await?;
    Ok(())
}
