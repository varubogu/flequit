//! サブタスクタグ用統合リポジトリ

use async_trait::async_trait;
use log::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::subtask_tag::SubtaskTagLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask_tag::SubtaskTagLocalSqliteRepository;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::types::id_types::{ProjectId, SubTaskId, TagId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_tag_repository_trait::SubTaskTagRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum SubTaskTagRepositoryVariant {
    LocalSqlite(SubtaskTagLocalSqliteRepository),
    LocalAutomerge(SubtaskTagLocalAutomergeRepository),
}

impl SubTaskTagRepositoryTrait for SubTaskTagRepositoryVariant {}

#[async_trait]
impl ProjectRelationRepository<SubTaskTag, SubTaskId, TagId> for SubTaskTagRepositoryVariant {
    #[tracing::instrument(level = "trace")]
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.add(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.add(project_id, parent_id, child_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.remove(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.remove(project_id, parent_id, child_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.remove_all(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.remove_all(project_id, parent_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskTag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relations(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.find_relations(project_id, parent_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTaskTag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all(project_id).await,
            Self::LocalAutomerge(repo) => repo.find_all(project_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.exists(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.exists(project_id, parent_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.count(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.count(project_id, parent_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<Option<SubTaskTag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relation(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.find_relation(project_id, parent_id, child_id).await,
        }
    }
}

#[derive(Debug)]
pub struct SubTaskTagUnifiedRepository {
    save_repositories: Vec<SubTaskTagRepositoryVariant>,
    search_repositories: Vec<SubTaskTagRepositoryVariant>,
}

impl Default for SubTaskTagUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl SubTaskTagUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    pub fn new(
        save_repositories: Vec<SubTaskTagRepositoryVariant>,
        search_repositories: Vec<SubTaskTagRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: SubtaskTagLocalSqliteRepository) {
        self.save_repositories
            .push(SubTaskTagRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_save(&mut self, automerge_repo: SubtaskTagLocalAutomergeRepository) {
        self.save_repositories
            .push(SubTaskTagRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: SubtaskTagLocalSqliteRepository) {
        self.search_repositories
            .push(SubTaskTagRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_search(&mut self, automerge_repo: SubtaskTagLocalAutomergeRepository) {
        self.search_repositories
            .push(SubTaskTagRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(SubTaskTagRepositoryVariant::Web(web_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_search(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.search_repositories.push(SubTaskTagRepositoryVariant::Web(web_repo));
    }
}

impl SubTaskTagRepositoryTrait for SubTaskTagUnifiedRepository {}

#[async_trait]
impl ProjectRelationRepository<SubTaskTag, SubTaskId, TagId> for SubTaskTagUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Adding subtask tag relation - project: {}, subtask: {}, tag: {}",
            project_id, parent_id, child_id
        );

        for repository in &self.save_repositories {
            repository.add(project_id, parent_id, child_id).await?;
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing subtask tag relation - project: {}, subtask: {}, tag: {}",
            project_id, parent_id, child_id
        );

        for repository in &self.save_repositories {
            repository.remove(project_id, parent_id, child_id).await?;
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing all subtask tags for subtask - project: {}, subtask: {}",
            project_id, parent_id
        );

        for repository in &self.save_repositories {
            repository.remove_all(project_id, parent_id).await?;
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace")]
    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskTag>, RepositoryError> {
        info!(
            "Finding subtask tags - project: {}, subtask: {}",
            project_id, parent_id
        );

        if let Some(repository) = self.search_repositories.first() {
            repository.find_relations(project_id, parent_id).await
        } else {
            Ok(Vec::new())
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTaskTag>, RepositoryError> {
        info!("Finding all subtask tags in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.find_all(project_id).await
        } else {
            Ok(Vec::new())
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        info!(
            "Checking if subtask tags exist - project: {}, subtask: {}",
            project_id, parent_id
        );

        for repository in &self.search_repositories {
            if repository.exists(project_id, parent_id).await? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    #[tracing::instrument(level = "trace")]
    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        info!(
            "Counting subtask tags for subtask - project: {}, subtask: {}",
            project_id, parent_id
        );

        if let Some(repository) = self.search_repositories.first() {
            repository.count(project_id, parent_id).await
        } else {
            Ok(0)
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &TagId,
    ) -> Result<Option<SubTaskTag>, RepositoryError> {
        info!(
            "Finding specific subtask tag relation - project: {}, subtask: {}, tag: {}",
            project_id, parent_id, child_id
        );

        for repository in &self.search_repositories {
            if let Some(relation) = repository
                .find_relation(project_id, parent_id, child_id)
                .await?
            {
                return Ok(Some(relation));
            }
        }

        Ok(None)
    }
}
