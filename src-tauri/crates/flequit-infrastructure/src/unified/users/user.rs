//! ユーザー用統合リポジトリ

use async_trait::async_trait;
use log::info;

use flequit_infrastructure_automerge::infrastructure::users::user::UserLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::users::user::UserLocalSqliteRepository;
use flequit_model::models::users::User;
use flequit_model::types::id_types::UserId;
use flequit_repository::patchable_trait::Patchable;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::users::user_repository_trait::UserRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

/// UserRepositoryTrait実装の静的ディスパッチ対応enum
#[derive(Debug)]
pub enum UserRepositoryVariant {
    LocalSqlite(UserLocalSqliteRepository),
    LocalAutomerge(UserLocalAutomergeRepository),
    // 将来的にWeb実装などを追加
}

impl UserRepositoryTrait for UserRepositoryVariant {}

#[async_trait]
impl Repository<User, UserId> for UserRepositoryVariant {
    async fn save(&self, entity: &User) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(entity).await,
            Self::LocalAutomerge(repo) => repo.save(entity).await,
        }
    }

    async fn find_by_id(&self, id: &UserId) -> Result<Option<User>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_id(id).await,
            Self::LocalAutomerge(repo) => repo.find_by_id(id).await,
        }
    }

    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all().await,
            Self::LocalAutomerge(repo) => repo.find_all().await,
        }
    }

    async fn delete(&self, id: &UserId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(id).await,
            Self::LocalAutomerge(repo) => repo.delete(id).await,
        }
    }

    async fn exists(&self, id: &UserId) -> Result<bool, RepositoryError> {
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

/// ユーザー用統合リポジトリ
///
/// 保存用と検索用のリポジトリを分離管理し、冗長化と高速検索を両立する。
#[derive(Debug)]
pub struct UserUnifiedRepository {
    /// 保存用リポジトリ（SQLite + Automerge など複数想定）
    save_repositories: Vec<UserRepositoryVariant>,
    /// 検索用リポジトリ（通常はSQLiteを優先）
    search_repositories: Vec<UserRepositoryVariant>,
}

impl Default for UserUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl UserUnifiedRepository {
    /// 新しい統合リポジトリを作成
    pub fn new(
        save_repositories: Vec<UserRepositoryVariant>,
        search_repositories: Vec<UserRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    /// 保存用リポジトリリストを取得
    pub fn save_repositories(&self) -> &[UserRepositoryVariant] {
        &self.save_repositories
    }

    /// 検索用リポジトリリストを取得
    pub fn search_repositories(&self) -> &[UserRepositoryVariant] {
        &self.search_repositories
    }

    /// SQLiteリポジトリを保存用に追加
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: UserLocalSqliteRepository) {
        self.save_repositories
            .push(UserRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    /// SQLiteリポジトリを検索用に追加
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: UserLocalSqliteRepository) {
        self.search_repositories
            .push(UserRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    /// Automergeリポジトリを保存用に追加
    pub fn add_automerge_for_save(&mut self, automerge_repo: UserLocalAutomergeRepository) {
        self.save_repositories
            .push(UserRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    /// 便利メソッド: SQLiteを保存用と検索用の両方に追加
    pub fn add_sqlite_for_both(
        &mut self,
        sqlite_repo_save: UserLocalSqliteRepository,
        sqlite_repo_search: UserLocalSqliteRepository,
    ) {
        self.save_repositories
            .push(UserRepositoryVariant::LocalSqlite(sqlite_repo_save));
        self.search_repositories
            .push(UserRepositoryVariant::LocalSqlite(sqlite_repo_search));
    }
}

#[async_trait]
impl Repository<User, UserId> for UserUnifiedRepository {
    /// 保存用リポジトリ（SQLite + Automerge + α）に保存
    async fn save(&self, entity: &User) -> Result<(), RepositoryError> {
        info!(
            "UserUnifiedRepository::save - 保存用リポジトリ {} 箇所に保存",
            self.save_repositories.len()
        );
        info!("{:?}", entity);

        for repo in &self.save_repositories {
            repo.save(entity).await?;
        }

        Ok(())
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）から高速検索
    async fn find_by_id(&self, id: &UserId) -> Result<Option<User>, RepositoryError> {
        info!("UserUnifiedRepository::find_by_id - 検索用リポジトリから検索");
        info!("{:?}", id);

        for repo in &self.search_repositories {
            if let Some(user) = repo.find_by_id(id).await? {
                return Ok(Some(user));
            }
        }

        Ok(None)
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）から高速取得
    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> {
        info!("UserUnifiedRepository::find_all - 検索用リポジトリから取得");

        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.find_all().await
        } else {
            Ok(vec![])
        }
    }

    /// 保存用リポジトリ（SQLite + Automerge + α）から削除
    async fn delete(&self, id: &UserId) -> Result<(), RepositoryError> {
        info!(
            "UserUnifiedRepository::delete - 保存用リポジトリ {} 箇所から削除",
            self.save_repositories.len()
        );
        info!("{:?}", id);

        for repo in &self.save_repositories {
            repo.delete(id).await?;
        }

        Ok(())
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）で存在確認
    async fn exists(&self, id: &UserId) -> Result<bool, RepositoryError> {
        info!("UserUnifiedRepository::exists - 検索用リポジトリで存在確認");
        info!("{:?}", id);

        for repo in &self.search_repositories {
            if repo.exists(id).await? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）の件数を返す
    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("UserUnifiedRepository::count - 検索用リポジトリの件数取得");

        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.count().await
        } else {
            Ok(0)
        }
    }
}

impl UserRepositoryTrait for UserUnifiedRepository {}

#[async_trait]
impl Patchable<User, UserId> for UserUnifiedRepository {}
