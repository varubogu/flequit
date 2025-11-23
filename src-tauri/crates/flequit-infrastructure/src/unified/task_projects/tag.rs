//! タグ用統合リポジトリ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use log::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::tag::TagLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::tag::TagLocalSqliteRepository;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::types::id_types::{ProjectId, TagId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::tag_repository_trait::TagRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum TagRepositoryVariant {
    LocalSqlite(TagLocalSqliteRepository),
    LocalAutomerge(TagLocalAutomergeRepository),
}

impl TagRepositoryTrait for TagRepositoryVariant {}

#[async_trait]
impl ProjectRepository<Tag, TagId> for TagRepositoryVariant {
    async fn save(&self, project_id: &ProjectId, entity: &Tag, user_id: &UserId, timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(project_id, entity, user_id, timestamp).await,
            Self::LocalAutomerge(repo) => repo.save(project_id, entity, user_id, timestamp).await,
        }
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &TagId,
    ) -> Result<Option<Tag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_id(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.find_by_id(project_id, id).await,
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all(project_id).await,
            Self::LocalAutomerge(repo) => repo.find_all(project_id).await,
        }
    }

    async fn delete(&self, project_id: &ProjectId, id: &TagId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.delete(project_id, id).await,
        }
    }

    async fn exists(&self, project_id: &ProjectId, id: &TagId) -> Result<bool, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.exists(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.exists(project_id, id).await,
        }
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.count(project_id).await,
            Self::LocalAutomerge(repo) => repo.count(project_id).await,
        }
    }
}

#[derive(Debug)]
pub struct TagUnifiedRepository {
    save_repositories: Vec<TagRepositoryVariant>,
    search_repositories: Vec<TagRepositoryVariant>,
}

impl Default for TagUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl TagUnifiedRepository {
    pub fn new(
        save_repositories: Vec<TagRepositoryVariant>,
        search_repositories: Vec<TagRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    pub fn add_sqlite_for_save(&mut self, sqlite_repo: TagLocalSqliteRepository) {
        self.save_repositories
            .push(TagRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_save(&mut self, automerge_repo: TagLocalAutomergeRepository) {
        self.save_repositories
            .push(TagRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn add_sqlite_for_search(&mut self, sqlite_repo: TagLocalSqliteRepository) {
        self.search_repositories
            .push(TagRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_search(&mut self, automerge_repo: TagLocalAutomergeRepository) {
        self.search_repositories
            .push(TagRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(TagRepositoryVariant::Web(web_repo));
    }

    pub fn add_web_for_search(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.search_repositories.push(TagRepositoryVariant::Web(web_repo));
    }

    /// 保存用リポジトリの数を取得
    pub fn save_repositories_count(&self) -> usize {
        self.save_repositories.len()
    }

    /// 検索用リポジトリの数を取得
    pub fn search_repositories_count(&self) -> usize {
        self.search_repositories.len()
    }

    /// タグを関連データと共にトランザクション内で削除
    pub async fn delete_with_relations(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Deleting tag with relations - project: {}, tag: {}",
            project_id, tag_id
        );

        // SQLiteリポジトリでトランザクション内で全削除を実行
        for repository in &self.save_repositories {
            match repository {
                TagRepositoryVariant::LocalSqlite(repo) => {
                    // SQLiteはトランザクション付き削除を使用
                    repo.delete_with_relations(project_id, tag_id).await?;
                }
                TagRepositoryVariant::LocalAutomerge(repo) => {
                    // Automergeは通常の削除（トランザクション不要）
                    repo.delete(project_id, tag_id).await?;
                }
            }
        }

        Ok(())
    }
}

impl TagRepositoryTrait for TagUnifiedRepository {}

#[async_trait]
impl ProjectRepository<Tag, TagId> for TagUnifiedRepository {
    async fn save(&self, project_id: &ProjectId, entity: &Tag, user_id: &UserId, timestamp: &DateTime<Utc>) -> Result<(), RepositoryError> {
        info!(
            "Saving tag entity with ID: {} in project: {}",
            entity.id, project_id
        );

        for repository in &self.save_repositories {
            repository.save(project_id, entity, user_id, timestamp).await?;
        }

        Ok(())
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &TagId,
    ) -> Result<Option<Tag>, RepositoryError> {
        info!("Finding tag by ID: {} in project: {}", id, project_id);

        for repository in &self.search_repositories {
            if let Some(entity) = repository.find_by_id(project_id, id).await? {
                return Ok(Some(entity));
            }
        }

        Ok(None)
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        info!("Finding all tags in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.find_all(project_id).await
        } else {
            Ok(vec![])
        }
    }

    async fn delete(&self, project_id: &ProjectId, id: &TagId) -> Result<(), RepositoryError> {
        info!("Deleting tag with ID: {} in project: {}", id, project_id);

        for repository in &self.save_repositories {
            repository.delete(project_id, id).await?;
        }

        Ok(())
    }

    async fn exists(&self, project_id: &ProjectId, id: &TagId) -> Result<bool, RepositoryError> {
        info!(
            "Checking if tag exists with ID: {} in project: {}",
            id, project_id
        );

        for repository in &self.search_repositories {
            if repository.exists(project_id, id).await? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        info!("Counting tags in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.count(project_id).await
        } else {
            Ok(0)
        }
    }
}
