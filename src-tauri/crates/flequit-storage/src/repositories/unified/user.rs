//! ユーザー用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! ユーザーエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use flequit_model::models::user::User;
use flequit_model::types::id_types::UserId;
use crate::errors::RepositoryError;
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::local_automerge::user::UserLocalAutomergeRepository;
use crate::repositories::local_sqlite::user::UserLocalSqliteRepository;
use crate::repositories::user_repository_trait::UserRepositoryTrait;

/// UserRepositoryTrait実装の静的ディスパッチ対応enum
#[derive(Debug)]
pub enum UserRepositoryVariant {
    Sqlite(UserLocalSqliteRepository),
    Automerge(UserLocalAutomergeRepository),
    // 将来的にWebの実装が追加される予定
    // Web(WebUserRepository),
}

impl UserRepositoryTrait for UserRepositoryVariant {}

#[async_trait]
impl Repository<User, UserId> for UserRepositoryVariant {
    async fn save(&self, entity: &User) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.save(entity).await,
            Self::Automerge(repo) => repo.save(entity).await,
        }
    }

    async fn find_by_id(&self, id: &UserId) -> Result<Option<User>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.find_by_id(id).await,
            Self::Automerge(repo) => repo.find_by_id(id).await,
        }
    }

    async fn find_all(&self) -> Result<Vec<User>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.find_all().await,
            Self::Automerge(repo) => repo.find_all().await,
        }
    }

    async fn delete(&self, id: &UserId) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.delete(id).await,
            Self::Automerge(repo) => repo.delete(id).await,
        }
    }

    async fn exists(&self, id: &UserId) -> Result<bool, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.exists(id).await,
            Self::Automerge(repo) => repo.exists(id).await,
        }
    }

    async fn count(&self) -> Result<u64, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.count().await,
            Self::Automerge(repo) => repo.count().await,
        }
    }
}

/// ユーザー用統合リポジトリ
///
/// 保存用と検索用のリポジトリを分離管理し、
/// ユーザーエンティティに最適化されたアクセスパターンを提供する。
pub struct UserUnifiedRepository {
    /// 保存用リポジトリ（冗長化のため複数: SQLite + Automerge + α）
    save_repositories: Vec<UserRepositoryVariant>,
    /// 検索用リポジトリ（高速化のため最適化: 通常はSQLiteのみ）
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
            .push(UserRepositoryVariant::Sqlite(sqlite_repo));
    }

    /// SQLiteリポジトリを検索用に追加
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: UserLocalSqliteRepository) {
        self.search_repositories
            .push(UserRepositoryVariant::Sqlite(sqlite_repo));
    }

    /// Automergeリポジトリを保存用に追加
    pub fn add_automerge_for_save(&mut self, automerge_repo: UserLocalAutomergeRepository) {
        self.save_repositories
            .push(UserRepositoryVariant::Automerge(automerge_repo));
    }

    /// 便利メソッド: SQLiteを保存用と検索用の両方に追加
    pub fn add_sqlite_for_both(
        &mut self,
        sqlite_repo_save: UserLocalSqliteRepository,
        sqlite_repo_search: UserLocalSqliteRepository,
    ) {
        self.save_repositories
            .push(UserRepositoryVariant::Sqlite(sqlite_repo_save));
        self.search_repositories
            .push(UserRepositoryVariant::Sqlite(sqlite_repo_search));
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

        // 全ての保存用リポジトリに順次保存
        for repo in &self.save_repositories {
            repo.save(entity).await?;
        }

        Ok(())
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）から高速検索
    async fn find_by_id(&self, id: &UserId) -> Result<Option<User>, RepositoryError> {
        info!("UserUnifiedRepository::find_by_id - 検索用リポジトリから検索");
        info!("{:?}", id);

        // 検索用リポジトリから順次検索（通常は最初のSQLiteで見つかる）
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

        // 最初の検索用リポジトリから取得（通常はSQLite）
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

        // 全ての保存用リポジトリから削除
        for repo in &self.save_repositories {
            repo.delete(id).await?;
        }

        Ok(())
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）で存在確認
    async fn exists(&self, id: &UserId) -> Result<bool, RepositoryError> {
        info!("UserUnifiedRepository::exists - 検索用リポジトリで存在確認");
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
        info!("UserUnifiedRepository::count - 検索用リポジトリの件数取得");

        // 最初の検索用リポジトリの件数（通常はSQLite）
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
