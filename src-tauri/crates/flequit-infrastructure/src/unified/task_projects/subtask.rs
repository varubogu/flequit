//! サブタスク用統合リポジトリ

use async_trait::async_trait;
use log::info;

use flequit_types::errors::repository_error::RepositoryError;
use flequit_repository::repositories::task_projects::subtask_repository_trait::SubTaskRepositoryTrait;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_infrastructure_automerge::infrastructure::task_projects::subtask::SubTaskLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask::SubTaskLocalSqliteRepository;
use flequit_model::models::task_projects::subtask::SubTask;
use flequit_model::types::id_types::{SubTaskId, ProjectId};

#[derive(Debug)]
pub enum SubTaskRepositoryVariant {
    LocalSqlite(SubTaskLocalSqliteRepository),
    LocalAutomerge(SubTaskLocalAutomergeRepository),
}

impl SubTaskRepositoryTrait for SubTaskRepositoryVariant {}


#[async_trait]
impl ProjectRepository<SubTask, SubTaskId> for SubTaskRepositoryVariant {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, project_id: &ProjectId, entity: &SubTask) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(project_id, entity).await,
            Self::LocalAutomerge(repo) => repo.save(project_id, entity).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_id(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.find_by_id(project_id, id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTask>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all(project_id).await,
            Self::LocalAutomerge(repo) => repo.find_all(project_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.delete(project_id, id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<bool, RepositoryError> {
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
pub struct SubTaskUnifiedRepository {
    save_repositories: Vec<SubTaskRepositoryVariant>,
    search_repositories: Vec<SubTaskRepositoryVariant>,
}

impl Default for SubTaskUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl SubTaskUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    pub fn new(
        save_repositories: Vec<SubTaskRepositoryVariant>,
        search_repositories: Vec<SubTaskRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: SubTaskLocalSqliteRepository) {
        self.save_repositories
            .push(SubTaskRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_save(&mut self, automerge_repo: SubTaskLocalAutomergeRepository) {
        self.save_repositories
            .push(SubTaskRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: SubTaskLocalSqliteRepository) {
        self.search_repositories
            .push(SubTaskRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_search(&mut self, automerge_repo: SubTaskLocalAutomergeRepository) {
        self.search_repositories
            .push(SubTaskRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(SubTaskRepositoryVariant::Web(web_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_search(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.search_repositories.push(SubTaskRepositoryVariant::Web(web_repo));
    }
}

impl SubTaskRepositoryTrait for SubTaskUnifiedRepository {}

#[async_trait]
impl ProjectRepository<SubTask, SubTaskId> for SubTaskUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    async fn save(&self, project_id: &ProjectId, entity: &SubTask) -> Result<(), RepositoryError> {
        info!("Saving subtask entity with ID: {} in project: {}", entity.id, project_id);

        for repository in &self.save_repositories {
            repository.save(project_id, entity).await?;
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn find_by_id(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<Option<SubTask>, RepositoryError> {
        info!("Finding subtask by ID: {} in project: {}", id, project_id);

        for repository in &self.search_repositories {
            if let Some(entity) = repository.find_by_id(project_id, id).await? {
                return Ok(Some(entity));
            }
        }

        Ok(None)
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTask>, RepositoryError> {
        info!("Finding all subtasks in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.find_all(project_id).await
        } else {
            Ok(vec![])
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn delete(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<(), RepositoryError> {
        info!("Deleting subtask with ID: {} in project: {}", id, project_id);

        for repository in &self.save_repositories {
            repository.delete(project_id, id).await?;
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(&self, project_id: &ProjectId, id: &SubTaskId) -> Result<bool, RepositoryError> {
        info!("Checking if subtask exists with ID: {} in project: {}", id, project_id);

        for repository in &self.search_repositories {
            if repository.exists(project_id, id).await? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    #[tracing::instrument(level = "trace")]
    async fn count(&self, project_id: &ProjectId) -> Result<u64, RepositoryError> {
        info!("Counting subtasks in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.count(project_id).await
        } else {
            Ok(0)
        }
    }
}
