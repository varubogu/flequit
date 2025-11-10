//! Account用SQLiteリポジトリ
//!
//! アカウントデータのSQLiteベースでのCRUD操作を提供

use super::super::database_manager::DatabaseManager;
use crate::errors::sqlite_error::SQLiteError;
use chrono::{DateTime, Utc};
use crate::models::account::{ActiveModel as AccountActiveModel, Column, Entity as AccountEntity};
use crate::models::{DomainToSqliteConverter, SqliteModelConverter};
use flequit_model::models::accounts::account::Account;
use flequit_model::types::id_types::{AccountId, UserId};
use flequit_repository::repositories::accounts::account_repository_trait::AccountRepositoryTrait;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Account用SQLiteリポジトリ
#[derive(Debug)]
pub struct AccountLocalSqliteRepository {
    db_manager: Arc<RwLock<DatabaseManager>>,
}

impl AccountLocalSqliteRepository {
    /// 新しいAccountRepositoryを作成

    pub fn new(db_manager: Arc<RwLock<DatabaseManager>>) -> Self {
        Self { db_manager }
    }

    /// メールアドレスでアカウントを検索

    pub async fn find_by_email(&self, email: &str) -> Result<Option<Account>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = AccountEntity::find()
            .filter(Column::Email.eq(email))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let account = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    /// プロバイダーとプロバイダーIDでアカウントを検索

    pub async fn find_by_provider(
        &self,
        provider: &str,
        provider_id: &str,
    ) -> Result<Option<Account>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        if let Some(model) = AccountEntity::find()
            .filter(Column::Provider.eq(provider))
            .filter(Column::ProviderId.eq(provider_id))
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let account = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    /// アクティブなアカウントを取得

    pub async fn find_active_accounts(&self) -> Result<Vec<Account>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = AccountEntity::find()
            .filter(Column::IsActive.eq(true))
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut accounts = Vec::new();
        for model in models {
            let account = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            accounts.push(account);
        }

        Ok(accounts)
    }

    /// 現在アクティブなアカウントを取得（最新のアクティブアカウント）

    pub async fn find_current_account(&self) -> Result<Option<Account>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = AccountEntity::find()
            .filter(Column::IsActive.eq(true))
            .order_by_desc(Column::CreatedAt)
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let account = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    /// アカウントをアクティブ化（他のアカウントは非アクティブ化）

    pub async fn activate_account(&self, account_id: &str) -> Result<Account, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // すべてのアカウントを非アクティブ化
        AccountEntity::update_many()
            .col_expr(Column::IsActive, sea_orm::sea_query::Expr::value(false))
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        // 指定されたアカウントをアクティブ化
        let account_model = AccountEntity::find_by_id(account_id)
            .one(db)
            .await
            .map_err(|_| RepositoryError::NotFound(format!("Account not found: {}", account_id)))?
            .ok_or_else(|| {
                RepositoryError::NotFound(format!("Account not found: {}", account_id))
            })?;

        let mut active_model: AccountActiveModel = account_model.into();
        active_model.is_active = sea_orm::Set(true);
        active_model.updated_at = sea_orm::Set(chrono::Utc::now());

        let updated = active_model
            .update(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        updated
            .to_domain_model()
            .await
            .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))
    }

    /// プロバイダー別のアカウント数を取得

    pub async fn count_by_provider(&self, provider: &str) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let count = AccountEntity::find()
            .filter(Column::Provider.eq(provider))
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        Ok(count)
    }
}

impl AccountRepositoryTrait for AccountLocalSqliteRepository {}

#[async_trait::async_trait]
impl Repository<Account, AccountId> for AccountLocalSqliteRepository {
    async fn save(&self, account: &Account, _user_id: &UserId, _timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        // 既存のアカウントをチェック（プロバイダーとプロバイダーIDで）
        let existing = if let Some(provider_id) = &account.provider_id {
            AccountEntity::find()
                .filter(Column::Provider.eq(&account.provider))
                .filter(Column::ProviderId.eq(provider_id))
                .one(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        } else {
            None
        };

        if let Some(existing_model) = existing {
            // 更新
            let mut active_model: AccountActiveModel = existing_model.into();
            let new_active = account
                .to_sqlite_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;

            active_model.email = new_active.email;
            active_model.is_active = new_active.is_active;
            active_model.updated_at = new_active.updated_at;

            active_model
                .update(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            Ok(())
        } else {
            // 新規作成
            let active_model = account
                .to_sqlite_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            active_model
                .insert(db)
                .await
                .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
            Ok(())
        }
    }

    async fn find_by_id(&self, id: &AccountId) -> Result<Option<Account>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        if let Some(model) = AccountEntity::find_by_id(id.to_string())
            .one(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?
        {
            let account = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            Ok(Some(account))
        } else {
            Ok(None)
        }
    }

    async fn delete(&self, id: &AccountId) -> Result<(), RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        AccountEntity::delete_by_id(id.to_string())
            .exec(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(())
    }

    async fn find_all(&self) -> Result<Vec<Account>, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;

        let models = AccountEntity::find()
            .order_by_asc(Column::CreatedAt)
            .all(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;

        let mut accounts = Vec::new();
        for model in models {
            let account = model
                .to_domain_model()
                .await
                .map_err(|e: String| RepositoryError::from(SQLiteError::ConversionError(e)))?;
            accounts.push(account);
        }

        Ok(accounts)
    }

    async fn exists(&self, id: &AccountId) -> Result<bool, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = AccountEntity::find_by_id(id.to_string())
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count > 0)
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        let db_manager = self.db_manager.read().await;
        let db = db_manager
            .get_connection()
            .await
            .map_err(|e| RepositoryError::from(e))?;
        let count = AccountEntity::find()
            .count(db)
            .await
            .map_err(|e| RepositoryError::from(SQLiteError::from(e)))?;
        Ok(count)
    }
}
