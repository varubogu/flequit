//! InfrastructureRepositories のトランザクション管理実装
//!
//! InfrastructureRepositoriesがトランザクション管理機能を提供します。
//! 内部的にはSQLiteのDatabaseManagerのTransactionManager実装を使用します。

use super::InfrastructureRepositories;
use async_trait::async_trait;
use flequit_model::traits::TransactionManager;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::DatabaseTransaction;

#[async_trait]
impl TransactionManager for InfrastructureRepositories {
    type Transaction = DatabaseTransaction;

    async fn begin(&self) -> Result<Self::Transaction, RepositoryError> {
        // unified_manager経由でSQLite Database Managerにアクセスしてトランザクションを開始
        if let Some(sqlite_repos) = self.unified_manager.sqlite_repositories() {
            let sqlite_repos_guard = sqlite_repos.read().await;
            let db_manager = sqlite_repos_guard.database_manager();
            let db_manager_guard = db_manager.read().await;
            db_manager_guard.begin().await
        } else {
            Err(RepositoryError::DatabaseError(
                "SQLite repositories not initialized".to_string(),
            ))
        }
    }

    async fn commit(&self, txn: Self::Transaction) -> Result<(), RepositoryError> {
        // unified_manager経由でSQLite Database Managerにアクセスしてコミット
        if let Some(sqlite_repos) = self.unified_manager.sqlite_repositories() {
            let sqlite_repos_guard = sqlite_repos.read().await;
            let db_manager = sqlite_repos_guard.database_manager();
            let db_manager_guard = db_manager.read().await;
            db_manager_guard.commit(txn).await
        } else {
            Err(RepositoryError::DatabaseError(
                "SQLite repositories not initialized".to_string(),
            ))
        }
    }

    async fn rollback(&self, txn: Self::Transaction) -> Result<(), RepositoryError> {
        // unified_manager経由でSQLite Database Managerにアクセスしてロールバック
        if let Some(sqlite_repos) = self.unified_manager.sqlite_repositories() {
            let sqlite_repos_guard = sqlite_repos.read().await;
            let db_manager = sqlite_repos_guard.database_manager();
            let db_manager_guard = db_manager.read().await;
            db_manager_guard.rollback(txn).await
        } else {
            Err(RepositoryError::DatabaseError(
                "SQLite repositories not initialized".to_string(),
            ))
        }
    }
}
