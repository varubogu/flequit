//! タグ用統合リポジトリ

use async_trait::async_trait;
use log::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::tag::TagLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::tag::TagLocalSqliteRepository;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::types::id_types::{ProjectId, TagId};
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
    #[tracing::instrument(level = "trace")]
    async fn save(&self, project_id: &ProjectId, entity: &Tag) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(project_id, entity).await,
            Self::LocalAutomerge(repo) => repo.save(project_id, entity).await,
        }
    }

    #[tracing::instrument(level = "trace")]
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

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all(project_id).await,
            Self::LocalAutomerge(repo) => repo.find_all(project_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, project_id: &ProjectId, id: &TagId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.delete(project_id, id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, project_id: &ProjectId, id: &TagId) -> Result<bool, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.exists(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.exists(project_id, id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
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
    #[tracing::instrument(level = "trace")]
    pub fn new(
        save_repositories: Vec<TagRepositoryVariant>,
        search_repositories: Vec<TagRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: TagLocalSqliteRepository) {
        self.save_repositories
            .push(TagRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_save(&mut self, automerge_repo: TagLocalAutomergeRepository) {
        self.save_repositories
            .push(TagRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: TagLocalSqliteRepository) {
        self.search_repositories
            .push(TagRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_search(&mut self, automerge_repo: TagLocalAutomergeRepository) {
        self.search_repositories
            .push(TagRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(TagRepositoryVariant::Web(web_repo));
    }

    #[tracing::instrument(level = "trace")]
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
}

impl TagRepositoryTrait for TagUnifiedRepository {}

#[async_trait]
impl ProjectRepository<Tag, TagId> for TagUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, project_id: &ProjectId, entity: &Tag) -> Result<(), RepositoryError> {
        info!(
            "Saving tag entity with ID: {} in project: {}",
            entity.id, project_id
        );

        for repository in &self.save_repositories {
            repository.save(project_id, entity).await?;
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace")]
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

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        info!("Finding all tags in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.find_all(project_id).await
        } else {
            Ok(vec![])
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, project_id: &ProjectId, id: &TagId) -> Result<(), RepositoryError> {
        info!("Deleting tag with ID: {} in project: {}", id, project_id);

        for repository in &self.save_repositories {
            repository.delete(project_id, id).await?;
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace")]
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

    #[tracing::instrument(level = "trace")]
    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        info!("Counting tags in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.count(project_id).await
        } else {
            Ok(0)
        }
    }
}
