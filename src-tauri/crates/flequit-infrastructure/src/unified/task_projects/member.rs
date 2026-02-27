//! メンバー用統合リポジトリ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use tracing::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::member::MemberLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::member::MemberLocalSqliteRepository;
use flequit_model::models::task_projects::member::Member;
use flequit_model::types::id_types::{ProjectId, UserId};
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum MemberRepositoryVariant {
    LocalSqlite(MemberLocalSqliteRepository),
    LocalAutomerge(MemberLocalAutomergeRepository),
}

#[async_trait]
impl ProjectRepository<Member, UserId> for MemberRepositoryVariant {
    async fn save(
        &self,
        project_id: &ProjectId,
        entity: &Member,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(project_id, entity, user_id, timestamp).await,
            Self::LocalAutomerge(repo) => repo.save(project_id, entity, user_id, timestamp).await,
        }
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &UserId,
    ) -> Result<Option<Member>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_id(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.find_by_id(project_id, id).await,
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Member>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all(project_id).await,
            Self::LocalAutomerge(repo) => repo.find_all(project_id).await,
        }
    }

    async fn delete(&self, project_id: &ProjectId, id: &UserId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.delete(project_id, id).await,
        }
    }

    async fn exists(&self, project_id: &ProjectId, id: &UserId) -> Result<bool, RepositoryError> {
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
pub struct MemberUnifiedRepository {
    save_repositories: Vec<MemberRepositoryVariant>,
    search_repositories: Vec<MemberRepositoryVariant>,
}

impl Default for MemberUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl MemberUnifiedRepository {
    pub fn new(
        save_repositories: Vec<MemberRepositoryVariant>,
        search_repositories: Vec<MemberRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    pub fn add_sqlite_for_save(&mut self, sqlite_repo: MemberLocalSqliteRepository) {
        self.save_repositories
            .push(MemberRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_save(&mut self, automerge_repo: MemberLocalAutomergeRepository) {
        self.save_repositories
            .push(MemberRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn add_sqlite_for_search(&mut self, sqlite_repo: MemberLocalSqliteRepository) {
        self.search_repositories
            .push(MemberRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_search(&mut self, automerge_repo: MemberLocalAutomergeRepository) {
        self.search_repositories
            .push(MemberRepositoryVariant::LocalAutomerge(automerge_repo));
    }
}

#[async_trait]
impl ProjectRepository<Member, UserId> for MemberUnifiedRepository {
    async fn save(
        &self,
        project_id: &ProjectId,
        entity: &Member,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        info!(
            "Saving member entity with ID: {} in project: {}",
            entity.id, project_id
        );

        for repository in &self.save_repositories {
            repository
                .save(project_id, entity, user_id, timestamp)
                .await?;
        }

        Ok(())
    }

    async fn find_by_id(
        &self,
        project_id: &ProjectId,
        id: &UserId,
    ) -> Result<Option<Member>, RepositoryError> {
        info!("Finding member by ID: {} in project: {}", id, project_id);

        for repository in &self.search_repositories {
            if let Some(member) = repository.find_by_id(project_id, id).await? {
                return Ok(Some(member));
            }
        }

        Ok(None)
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Member>, RepositoryError> {
        info!("Finding all members in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.find_all(project_id).await
        } else {
            Ok(Vec::new())
        }
    }

    async fn delete(&self, project_id: &ProjectId, id: &UserId) -> Result<(), RepositoryError> {
        info!("Deleting member with ID: {} in project: {}", id, project_id);

        for repository in &self.save_repositories {
            repository.delete(project_id, id).await?;
        }

        Ok(())
    }

    async fn exists(&self, project_id: &ProjectId, id: &UserId) -> Result<bool, RepositoryError> {
        info!(
            "Checking if member exists with ID: {} in project: {}",
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
        info!("Counting members in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.count(project_id).await
        } else {
            Ok(0)
        }
    }
}
