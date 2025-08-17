//! Account用SQLiteリポジトリ
//!
//! アカウントデータのSQLiteベースでのCRUD操作を提供

use log::info;
use sea_orm::{EntityTrait, QueryFilter, QueryOrder, ColumnTrait, ActiveModelTrait, PaginatorTrait};
use crate::models::account::Account;
use crate::models::sqlite::account::{Entity as AccountEntity, ActiveModel as AccountActiveModel, Column};
use crate::models::sqlite::{SqliteModelConverter, DomainToSqliteConverter};
use crate::repositories::base_repository_trait::Repository;
use crate::types::id_types::AccountId;
use super::{DatabaseManager, RepositoryError};

/// Account用SQLiteリポジトリ
pub struct AccountRepository {
    db_manager: DatabaseManager,
}

impl AccountRepository {
    /// 新しいAccountRepositoryを作成
    pub fn new(db_manager: DatabaseManager) -> Self {
        Self { db_manager }
    }

    /// メールアドレスでアカウントを検索
    pub async fn find_by_email(&self, email: &str) -> Result<Option<Account>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = AccountEntity::find()
            .filter(Column::Email.eq(email))
            .one(db)
            .await?
        {
            let account = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    /// プロバイダーとプロバイダーIDでアカウントを検索
    pub async fn find_by_provider(&self, provider: &str, provider_id: &str) -> Result<Option<Account>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = AccountEntity::find()
            .filter(Column::Provider.eq(provider))
            .filter(Column::ProviderId.eq(provider_id))
            .one(db)
            .await?
        {
            let account = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    /// アクティブなアカウントを取得
    pub async fn find_active_accounts(&self) -> Result<Vec<Account>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = AccountEntity::find()
            .filter(Column::IsActive.eq(true))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await?;

        let mut accounts = Vec::new();
        for model in models {
            let account = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            accounts.push(account);
        }

        Ok(accounts)
    }

    /// 現在アクティブなアカウントを取得（最新のアクティブアカウント）
    pub async fn find_current_account(&self) -> Result<Option<Account>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = AccountEntity::find()
            .filter(Column::IsActive.eq(true))
            .order_by_desc(Column::CreatedAt)
            .one(db)
            .await?
        {
            let account = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    /// アカウントをアクティブ化（他のアカウントは非アクティブ化）
    pub async fn activate_account(&self, account_id: &str) -> Result<Account, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        // すべてのアカウントを非アクティブ化
        AccountEntity::update_many()
            .col_expr(Column::IsActive, sea_orm::sea_query::Expr::value(false))
            .exec(db)
            .await?;

        // 指定されたアカウントをアクティブ化
        let account_model = AccountEntity::find_by_id(account_id)
            .one(db)
            .await?
            .ok_or_else(|| RepositoryError::NotFound(format!("Account not found: {}", account_id)))?;

        let mut active_model: AccountActiveModel = account_model.into();
        active_model.is_active = sea_orm::Set(true);
        active_model.updated_at = sea_orm::Set(chrono::Utc::now());

        let updated = active_model.update(db).await?;
        updated.to_domain_model().await.map_err(RepositoryError::Conversion)
    }

    /// プロバイダー別のアカウント数を取得
    pub async fn count_by_provider(&self, provider: &str) -> Result<u64, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let count = AccountEntity::find()
            .filter(Column::Provider.eq(provider))
            .count(db)
            .await?;

        Ok(count)
    }
}

#[async_trait::async_trait]
impl Repository<Account, AccountId> for AccountRepository {
    async fn save(&self, account: &Account) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        // 既存のアカウントをチェック（プロバイダーとプロバイダーIDで）
        let existing = if let Some(provider_id) = &account.provider_id {
            AccountEntity::find()
                .filter(Column::Provider.eq(&account.provider))
                .filter(Column::ProviderId.eq(provider_id))
                .one(db)
                .await?
        } else {
            None
        };

        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: AccountActiveModel = existing_model.into();
            let new_active = account.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;

            active_model.email = new_active.email;
            active_model.is_active = new_active.is_active;
            active_model.updated_at = new_active.updated_at;

            let updated = active_model.update(db).await?;
            Ok(())
        } else {
            // 新規作成
            let active_model = account.to_sqlite_model().await.map_err(RepositoryError::Conversion)?;
            let saved = active_model.insert(db).await?;
            Ok(())
        }
    }

    async fn find_by_id(&self, id: &AccountId) -> Result<Option<Account>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        if let Some(model) = AccountEntity::find_by_id(id.to_string()).one(db).await? {
            let account = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    async fn delete(&self, id: &AccountId) -> Result<(), RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let result = AccountEntity::delete_by_id(id.to_string())
            .exec(db)
            .await?;
        Ok(())
    }

    async fn find_all(&self) -> Result<Vec<Account>, RepositoryError> {
        let db = self.db_manager.get_connection().await?;

        let models = AccountEntity::find()
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await?;

        let mut accounts = Vec::new();
        for model in models {
            let account = model.to_domain_model().await.map_err(RepositoryError::Conversion)?;
            accounts.push(account);
        }

        Ok(accounts)
    }
    async fn exists(&self, id: &AccountId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists");
        info!("{:?}", id);
        Ok(true)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count");
        Ok(0)
    }
}
