//! プロジェクト用統合リポジトリ

use async_trait::async_trait;
use flequit_repository::patchable_trait::Patchable;
use log::info;

use flequit_types::errors::repository_error::RepositoryError;
use flequit_repository::repositories::task_projects::project_repository_trait::ProjectRepositoryTrait;
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_infrastructure_automerge::infrastructure::task_projects::project::ProjectLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::project::ProjectLocalSqliteRepository;
use flequit_model::models::task_projects::project::Project;
use flequit_model::types::id_types::ProjectId;

#[derive(Debug)]
pub enum ProjectRepositoryVariant {
    LocalSqlite(ProjectLocalSqliteRepository),
    LocalAutomerge(ProjectLocalAutomergeRepository),
}

impl ProjectRepositoryTrait for ProjectRepositoryVariant {}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectRepositoryVariant {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(entity).await,
            Self::LocalAutomerge(repo) => repo.save(entity).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_id(id).await,
            Self::LocalAutomerge(repo) => repo.find_by_id(id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all().await,
            Self::LocalAutomerge(repo) => repo.find_all().await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(id).await,
            Self::LocalAutomerge(repo) => repo.delete(id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.exists(id).await,
            Self::LocalAutomerge(repo) => repo.exists(id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self) -> Result<u64, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.count().await,
            Self::LocalAutomerge(repo) => repo.count().await,
        }
    }
}

#[derive(Debug)]
pub struct ProjectUnifiedRepository {
    save_repositories: Vec<ProjectRepositoryVariant>,
    search_repositories: Vec<ProjectRepositoryVariant>,
}

impl Default for ProjectUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl ProjectUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    pub fn new(
        save_repositories: Vec<ProjectRepositoryVariant>,
        search_repositories: Vec<ProjectRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: ProjectLocalSqliteRepository) {
        self.save_repositories
            .push(ProjectRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: ProjectLocalSqliteRepository) {
        self.search_repositories
            .push(ProjectRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_save(&mut self, automerge_repo: ProjectLocalAutomergeRepository) {
        self.save_repositories
            .push(ProjectRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_search(&mut self, automerge_repo: ProjectLocalAutomergeRepository) {
        self.search_repositories
            .push(ProjectRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(ProjectRepositoryVariant::Web(web_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_search(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.search_repositories.push(ProjectRepositoryVariant::Web(web_repo));
    }
}

#[async_trait]
impl Repository<Project, ProjectId> for ProjectUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, entity: &Project) -> Result<(), RepositoryError> {
        info!("ProjectUnifiedRepository::save - 保存用リポジトリ {} 箇所に保存", self.save_repositories.len());

        for repo in &self.save_repositories {
            repo.save(entity).await?;
        }
        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, id: &ProjectId) -> Result<Option<Project>, RepositoryError> {
        info!("ProjectUnifiedRepository::find_by_id - 検索用リポジトリから検索");

        for repo in &self.search_repositories {
            if let Some(project) = repo.find_by_id(id).await? {
                return Ok(Some(project));
            }
        }
        Ok(None)
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self) -> Result<Vec<Project>, RepositoryError> {
        info!("ProjectUnifiedRepository::find_all - 検索用リポジトリから取得");

        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.find_all().await
        } else {
            Ok(vec![])
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, id: &ProjectId) -> Result<(), RepositoryError> {
        info!("ProjectUnifiedRepository::delete - 保存用リポジトリ {} 箇所から削除", self.save_repositories.len());

        for repo in &self.save_repositories {
            repo.delete(id).await?;
        }
        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, id: &ProjectId) -> Result<bool, RepositoryError> {
        info!("ProjectUnifiedRepository::exists - 検索用リポジトリで存在確認");

        for repo in &self.search_repositories {
            if repo.exists(id).await? {
                return Ok(true);
            }
        }
        Ok(false)
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self) -> Result<u64, RepositoryError> {
        info!("ProjectUnifiedRepository::count - 検索用リポジトリの件数取得");

        if let Some(first_repo) = self.search_repositories.first() {
            first_repo.count().await
        } else {
            Ok(0)
        }
    }
}

impl ProjectRepositoryTrait for ProjectUnifiedRepository {}

#[async_trait]
impl Patchable<Project, ProjectId> for ProjectUnifiedRepository {}
