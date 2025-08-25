//! タスクリスト用統合リポジトリ
//!
//! SQLite（高速検索）とAutomerge（永続化・同期）を統合し、
//! タスクリストエンティティに最適化されたアクセスパターンを提供する。

use async_trait::async_trait;
use log::info;

use crate::errors::RepositoryError;
use crate::models::task_list::TaskList;
use crate::types::id_types::ProjectId;
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::local_automerge::task_list::TaskListLocalAutomergeRepository;
use crate::repositories::local_sqlite::task_list::TaskListLocalSqliteRepository;
use crate::repositories::task_list_repository_trait::TaskListRepositoryTrait;
use crate::types::id_types::TaskListId;

/// TaskListRepositoryTrait実装の静的ディスパッチ対応enum
#[derive(Debug)]
pub enum TaskListRepositoryVariant {
    Sqlite(TaskListLocalSqliteRepository),
    Automerge(TaskListLocalAutomergeRepository),
    // 将来的にWebの実装が追加される予定
    // Web(WebTaskListRepository),
}

impl TaskListRepositoryTrait for TaskListRepositoryVariant {}

#[async_trait]
impl Repository<TaskList, TaskListId> for TaskListRepositoryVariant {
    async fn save(&self, entity: &TaskList) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.save(entity).await,
            Self::Automerge(repo) => repo.save(entity).await,
        }
    }

    async fn find_by_id(&self, id: &TaskListId) -> Result<Option<TaskList>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.find_by_id(id).await,
            Self::Automerge(repo) => repo.find_by_id(id).await,
        }
    }

    async fn find_all(&self) -> Result<Vec<TaskList>, RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.find_all().await,
            Self::Automerge(repo) => repo.find_all().await,
        }
    }

    async fn delete(&self, id: &TaskListId) -> Result<(), RepositoryError> {
        match self {
            Self::Sqlite(repo) => repo.delete(id).await,
            Self::Automerge(repo) => repo.delete(id).await,
        }
    }

    async fn exists(&self, id: &TaskListId) -> Result<bool, RepositoryError> {
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

/// タスクリスト用統合リポジトリ
///
/// 保存用と検索用のリポジトリを分離管理し、
/// タスクリストエンティティに最適化されたアクセスパターンを提供する。
pub struct TaskListUnifiedRepository {
    /// 保存用リポジトリ（冗長化のため複数: SQLite + Automerge + α）
    save_repositories: Vec<TaskListRepositoryVariant>,
    /// 検索用リポジトリ（高速化のため最適化: 通常はSQLiteのみ）
    search_repositories: Vec<TaskListRepositoryVariant>,
}

impl Default for TaskListUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl TaskListUnifiedRepository {
    /// 新しい統合リポジトリを作成
    pub fn new(
        save_repositories: Vec<TaskListRepositoryVariant>,
        search_repositories: Vec<TaskListRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    /// 保存用リポジトリリストを取得
    pub fn save_repositories(&self) -> &[TaskListRepositoryVariant] {
        &self.save_repositories
    }

    /// 検索用リポジトリリストを取得
    pub fn search_repositories(&self) -> &[TaskListRepositoryVariant] {
        &self.search_repositories
    }

    /// SQLiteリポジトリを保存用に追加
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: TaskListLocalSqliteRepository) {
        self.save_repositories
            .push(TaskListRepositoryVariant::Sqlite(sqlite_repo));
    }

    /// SQLiteリポジトリを検索用に追加
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: TaskListLocalSqliteRepository) {
        self.search_repositories
            .push(TaskListRepositoryVariant::Sqlite(sqlite_repo));
    }

    /// Automergeリポジトリを保存用に追加
    pub fn add_automerge_for_save(&mut self, automerge_repo: TaskListLocalAutomergeRepository) {
        self.save_repositories
            .push(TaskListRepositoryVariant::Automerge(automerge_repo));
    }


    /// 便利メソッド: SQLiteを保存用と検索用の両方に追加
    pub fn add_sqlite_for_both(
        &mut self,
        sqlite_repo_save: TaskListLocalSqliteRepository,
        sqlite_repo_search: TaskListLocalSqliteRepository,
    ) {
        self.save_repositories
            .push(TaskListRepositoryVariant::Sqlite(sqlite_repo_save));
        self.search_repositories
            .push(TaskListRepositoryVariant::Sqlite(sqlite_repo_search));
    }
}

#[async_trait]
impl Repository<TaskList, TaskListId> for TaskListUnifiedRepository {
    /// 保存用リポジトリ（SQLite + Automerge + α）に保存
    async fn save(&self, entity: &TaskList) -> Result<(), RepositoryError> {
        info!(
            "TaskListUnifiedRepository::save - 保存用リポジトリ {} 箇所に保存",
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
    async fn find_by_id(&self, id: &TaskListId) -> Result<Option<TaskList>, RepositoryError> {
        info!("TaskListUnifiedRepository::find_by_id - 検索用リポジトリから検索");
        info!("{:?}", id);

        // 検索用リポジトリから順次検索（通常は最初のSQLiteで見つかる）
        for repo in &self.search_repositories {
            if let Some(task_list) = repo.find_by_id(id).await? {
                return Ok(Some(task_list));
            }
        }

        Ok(None)
    }

    /// 検索用リポジトリ（通常はSQLiteのみ）から高速取得
    async fn find_all(&self) -> Result<Vec<TaskList>, RepositoryError> {
        info!("TaskListUnifiedRepository::find_all - 検索用リポジトリから取得");

        // 最初の検索用リポジトリから取得（通常はSQLite）
        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.find_all().await
        } else {
            Ok(vec![])
        }
    }

    /// 保存用リポジトリ（SQLite + Automerge + α）から削除
    async fn delete(&self, id: &TaskListId) -> Result<(), RepositoryError> {
        info!(
            "TaskListUnifiedRepository::delete - 保存用リポジトリ {} 箇所から削除",
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
    async fn exists(&self, id: &TaskListId) -> Result<bool, RepositoryError> {
        info!("TaskListUnifiedRepository::exists - 検索用リポジトリで存在確認");
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
        info!("TaskListUnifiedRepository::count - 検索用リポジトリの件数取得");

        // 最初の検索用リポジトリの件数（通常はSQLite）
        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.count().await
        } else {
            Ok(0)
        }
    }
}

impl TaskListRepositoryTrait for TaskListUnifiedRepository {}

#[async_trait]
impl Patchable<TaskList, TaskListId> for TaskListUnifiedRepository {}
