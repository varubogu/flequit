//! サブタスク割り当て用統合リポジトリ

use async_trait::async_trait;
use log::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::subtask_assignments::SubtaskAssignmentLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask_assignments::SubtaskAssignmentLocalSqliteRepository;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::types::id_types::{ProjectId, SubTaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_assignment_repository_trait::SubTaskAssignmentRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum SubTaskAssignmentRepositoryVariant {
    LocalSqlite(SubtaskAssignmentLocalSqliteRepository),
    LocalAutomerge(SubtaskAssignmentLocalAutomergeRepository),
}

impl SubTaskAssignmentRepositoryTrait for SubTaskAssignmentRepositoryVariant {}

#[async_trait]
impl ProjectRelationRepository<SubTaskAssignment, SubTaskId, UserId>
    for SubTaskAssignmentRepositoryVariant
{
    #[tracing::instrument(level = "trace")]
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
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
        child_id: &UserId,
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
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relations(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.find_relations(project_id, parent_id).await,
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
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
        child_id: &UserId,
    ) -> Result<Option<SubTaskAssignment>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relation(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.find_relation(project_id, parent_id, child_id).await,
        }
    }
}

#[derive(Debug)]
pub struct SubTaskAssignmentUnifiedRepository {
    save_repositories: Vec<SubTaskAssignmentRepositoryVariant>,
    search_repositories: Vec<SubTaskAssignmentRepositoryVariant>,
}

impl Default for SubTaskAssignmentUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl SubTaskAssignmentUnifiedRepository {
    #[tracing::instrument(level = "trace")]
    pub fn new(
        save_repositories: Vec<SubTaskAssignmentRepositoryVariant>,
        search_repositories: Vec<SubTaskAssignmentRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_save(&mut self, sqlite_repo: SubtaskAssignmentLocalSqliteRepository) {
        self.save_repositories
            .push(SubTaskAssignmentRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_save(
        &mut self,
        automerge_repo: SubtaskAssignmentLocalAutomergeRepository,
    ) {
        self.save_repositories
            .push(SubTaskAssignmentRepositoryVariant::LocalAutomerge(
                automerge_repo,
            ));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_sqlite_for_search(&mut self, sqlite_repo: SubtaskAssignmentLocalSqliteRepository) {
        self.search_repositories
            .push(SubTaskAssignmentRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_automerge_for_search(
        &mut self,
        automerge_repo: SubtaskAssignmentLocalAutomergeRepository,
    ) {
        self.search_repositories
            .push(SubTaskAssignmentRepositoryVariant::LocalAutomerge(
                automerge_repo,
            ));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(SubTaskAssignmentRepositoryVariant::Web(web_repo));
    }

    #[tracing::instrument(level = "trace")]
    pub fn add_web_for_search(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.search_repositories.push(SubTaskAssignmentRepositoryVariant::Web(web_repo));
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

impl SubTaskAssignmentRepositoryTrait for SubTaskAssignmentUnifiedRepository {}

#[async_trait]
impl ProjectRelationRepository<SubTaskAssignment, SubTaskId, UserId>
    for SubTaskAssignmentUnifiedRepository
{
    #[tracing::instrument(level = "trace")]
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Adding subtask assignment - project: {}, subtask: {}, user: {}",
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
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing subtask assignment - project: {}, subtask: {}, user: {}",
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
            "Removing all subtask assignments for subtask - project: {}, subtask: {}",
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
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
        info!(
            "Finding subtask assignments - project: {}, subtask: {}",
            project_id, parent_id
        );

        if let Some(repository) = self.search_repositories.first() {
            repository.find_relations(project_id, parent_id).await
        } else {
            Ok(Vec::new())
        }
    }

    #[tracing::instrument(level = "trace")]
    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<SubTaskAssignment>, RepositoryError> {
        info!("Finding all subtask assignments in project: {}", project_id);

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
            "Checking if subtask assignments exist - project: {}, subtask: {}",
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
            "Counting subtask assignments for subtask - project: {}, subtask: {}",
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
        child_id: &UserId,
    ) -> Result<Option<SubTaskAssignment>, RepositoryError> {
        info!(
            "Finding specific subtask assignment - project: {}, subtask: {}, user: {}",
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
