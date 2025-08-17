//! アカウント用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! アカウントエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use crate::errors::RepositoryError;
use crate::models::account::Account;
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::AccountId;

/// アカウント用統合リポジトリ
///
/// 検索系操作はSQLite、保存系操作はAutomerge→SQLiteの順で実行し、
/// アカウントエンティティに最適化されたアクセスパターンを提供する。
pub struct AccountUnifiedRepository {

}

impl AccountUnifiedRepository {
    pub fn new() -> Self {
        Self {
        }
    }
}

#[async_trait]
impl Repository<Account, AccountId> for AccountUnifiedRepository {

    async fn save(&self, entity: &Account) -> Result<(), RepositoryError> {
        info!("AccountUnifiedRepository::save");
        info!("{:?}", entity);

        Ok(())
    }

    async fn find_by_id(&self, id: &AccountId) -> Result<Option<Account>, RepositoryError> {
        info!("AccountUnifiedRepository::find_by_id");
        info!("{:?}", id);
        Ok(Option::from(None))
    }

    async fn find_all(&self) -> Result<Vec<Account>, RepositoryError> {
        info!("AccountUnifiedRepository::find_all");
        Ok(vec![])
    }

    async fn delete(&self, id: &AccountId) -> Result<(), RepositoryError> {
        info!("AccountUnifiedRepository::delete");
        info!("{:?}", id);
        Ok(())
    }

    async fn exists(&self, id: &AccountId) -> Result<bool, RepositoryError> {
        info!("AccountUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("AccountUnifiedRepository::count");
        Ok(0)
    }
}
