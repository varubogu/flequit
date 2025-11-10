//! アカウント用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! アカウントエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_repository::patchable_trait::Patchable;
use log::info;

use flequit_infrastructure_automerge::infrastructure::accounts::account::AccountLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::accounts::account::AccountLocalSqliteRepository;
use flequit_model::models::accounts::account::Account;
use flequit_model::types::id_types::{AccountId, UserId};
use flequit_repository::repositories::accounts::account_repository_trait::AccountRepositoryTrait;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_types::errors::repository_error::RepositoryError;

/// AccountRepositoryTrait実装の静的ディスパッチ対応enum
#[derive(Debug)]
pub enum AccountRepositoryVariant {
    LocalSqlite(AccountLocalSqliteRepository),
    LocalAutomerge(AccountLocalAutomergeRepository),
    // 将来的にWebの実装が追加される予定
    // Web(WebAccountRepository),
}

impl AccountRepositoryTrait for AccountRepositoryVariant {}

#[async_trait]
impl Repository<Account, AccountId> for AccountRepositoryVariant {
    async fn save(&self, entity: &Account, user_id: &UserId, timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(entity, user_id, timestamp).await,
            Self::LocalAutomerge(repo) => repo.save(entity, user_id, timestamp).await,
        }
    }

    async fn find_by_id(&self, id: &AccountId) -> Result<Option<Account>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_id(id).await,
            Self::LocalAutomerge(repo) => repo.find_by_id(id).await,
        }
    }

    async fn find_all(&self) -> Result<Vec<Account>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all().await,
            Self::LocalAutomerge(repo) => repo.find_all().await,
        }
    }

    async fn delete(&self, id: &AccountId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(id).await,
            Self::LocalAutomerge(repo) => repo.delete(id).await,
        }
    }

    async fn exists(&self, id: &AccountId) -> Result<bool, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.exists(id).await,
            Self::LocalAutomerge(repo) => repo.exists(id).await,
        }
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.count().await,
            Self::LocalAutomerge(repo) => repo.count().await,
        }
    }
}

/// アカウント用統合リポジトリ
///
/// 保存用と検索用のリポジトリを分離管理し、
/// アカウントエンティティに最適化されたアクセスパターンを提供する。
#[derive(Debug)]
pub struct AccountUnifiedRepository {
    /// 保存用リポジトリ（冗長化のため複数: SQLite + Automerge + α）
    save_repositories: Vec<AccountRepositoryVariant>,
    /// 検索用リポジトリ（高速化のため最適化: 通常はSQLiteのみ）
    search_repositories: Vec<AccountRepositoryVariant>,
}

impl Default for AccountUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl AccountUnifiedRepository {
    /// 新しい統合リポジトリを作成

    pub fn new(
        save_repositories: Vec<AccountRepositoryVariant>,
        search_repositories: Vec<AccountRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    /// 保存用リポジトリリストを取得

    pub fn save_repositories(&self) -> &[AccountRepositoryVariant] {
        &self.save_repositories
    }

    /// 検索用リポジトリリストを取得

    pub fn search_repositories(&self) -> &[AccountRepositoryVariant] {
        &self.search_repositories
    }

    /// SQLiteリポジトリを保存用に追加

    pub fn add_sqlite_for_save(&mut self, sqlite_repo: AccountLocalSqliteRepository) {
        self.save_repositories
            .push(AccountRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    /// SQLiteリポジトリを検索用に追加

    pub fn add_sqlite_for_search(&mut self, sqlite_repo: AccountLocalSqliteRepository) {
        self.search_repositories
            .push(AccountRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    /// Automergeリポジトリを保存用に追加

    pub fn add_automerge_for_save(&mut self, automerge_repo: AccountLocalAutomergeRepository) {
        self.save_repositories
            .push(AccountRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    /// 便利メソッド: SQLiteを保存用と検索用の両方に追加

    pub fn add_sqlite_for_both(
        &mut self,
        sqlite_repo_save: AccountLocalSqliteRepository,
        sqlite_repo_search: AccountLocalSqliteRepository,
    ) {
        self.save_repositories
            .push(AccountRepositoryVariant::LocalSqlite(sqlite_repo_save));
        self.search_repositories
            .push(AccountRepositoryVariant::LocalSqlite(sqlite_repo_search));
    }
}

#[async_trait]
impl Repository<Account, AccountId> for AccountUnifiedRepository {
    /// 保存用リポジトリ（SQLite + Automerge + α）に保存

    async fn save(&self, entity: &Account, user_id: &UserId, timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        info!(
            "AccountUnifiedRepository::save - 保存用リポジトリ {} 箇所に保存",
            self.save_repositories.len()
        );
        info!("{:?}", entity);

        // 全ての保存用リポジトリに順次保存
        for repo in &self.save_repositories {
            repo.save(entity, user_id, timestamp).await?;
        }

        Ok(())
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）から高速検索

    async fn find_by_id(&self, id: &AccountId) -> Result<Option<Account>, RepositoryError> {
        info!("AccountUnifiedRepository::find_by_id - 検索用リポジトリから検索");
        info!("{:?}", id);

        // 検索用リポジトリから順次検索（通常は最初のSQLiteで見つかる）
        for repo in &self.search_repositories {
            if let Some(account) = repo.find_by_id(id).await? {
                return Ok(Some(account));
            }
        }

        Ok(None)
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）から高速取得

    async fn find_all(&self) -> Result<Vec<Account>, RepositoryError> {
        info!("AccountUnifiedRepository::find_all - 検索用リポジトリから取得");

        // 最初の検索用リポジトリから取得（通常はSQLite）
        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.find_all().await
        } else {
            Ok(vec![])
        }
    }

    /// 保存用リポジトリ（SQLite + Automerge + α）から削除

    async fn delete(&self, id: &AccountId) -> Result<(), RepositoryError> {
        info!(
            "AccountUnifiedRepository::delete - 保存用リポジトリ {} 箇所から削除",
            self.save_repositories.len()
        );
        info!("{:?}", id);

        // 全ての保存用リポジトリから削除
        for repo in &self.save_repositories {
            repo.delete(id).await?;
        }

        Ok(())
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）で存在確認

    async fn exists(&self, id: &AccountId) -> Result<bool, RepositoryError> {
        info!("AccountUnifiedRepository::exists - 検索用リポジトリで存在確認");
        info!("{:?}", id);

        // 検索用リポジトリで確認（通常はSQLiteで十分）
        for repo in &self.search_repositories {
            if repo.exists(id).await? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）の件数を返す

    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("AccountUnifiedRepository::count - 検索用リポジトリの件数取得");

        // 最初の検索用リポジトリの件数（通常はSQLite）
        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.count().await
        } else {
            Ok(0)
        }
    }
}

impl AccountRepositoryTrait for AccountUnifiedRepository {}

#[async_trait]
impl Patchable<Account, AccountId> for AccountUnifiedRepository {}
