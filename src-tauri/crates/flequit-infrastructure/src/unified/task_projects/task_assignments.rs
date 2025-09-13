//! タスク割り当て用統合リポジトリ

use async_trait::async_trait;
use log::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::task_assignments::TaskAssignmentLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::task_assignments::TaskAssignmentLocalSqliteRepository;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_assignment_repository_trait::TaskAssignmentRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum TaskAssignmentRepositoryVariant {
    LocalSqlite(TaskAssignmentLocalSqliteRepository),
    LocalAutomerge(TaskAssignmentLocalAutomergeRepository),
}

impl TaskAssignmentRepositoryTrait for TaskAssignmentRepositoryVariant {}

#[async_trait]
impl ProjectRelationRepository<TaskAssignment, TaskId, UserId> for TaskAssignmentRepositoryVariant {

    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.add(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.add(project_id, parent_id, child_id).await,
        }
    }


    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.remove(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.remove(project_id, parent_id, child_id).await,
        }
    }


    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.remove_all(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.remove_all(project_id, parent_id).await,
        }
    }


    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relations(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.find_relations(project_id, parent_id).await,
        }
    }


    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all(project_id).await,
            Self::LocalAutomerge(repo) => repo.find_all(project_id).await,
        }
    }


    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.exists(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.exists(project_id, parent_id).await,
        }
    }


    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.count(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.count(project_id, parent_id).await,
        }
    }


    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<Option<TaskAssignment>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relation(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.find_relation(project_id, parent_id, child_id).await,
        }
    }
}

#[derive(Debug)]
pub struct TaskAssignmentUnifiedRepository {
    save_repositories: Vec<TaskAssignmentRepositoryVariant>,
    search_repositories: Vec<TaskAssignmentRepositoryVariant>,
}

impl Default for TaskAssignmentUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl TaskAssignmentUnifiedRepository {

    pub fn new(
        save_repositories: Vec<TaskAssignmentRepositoryVariant>,
        search_repositories: Vec<TaskAssignmentRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }


    pub fn add_sqlite_for_save(&mut self, sqlite_repo: TaskAssignmentLocalSqliteRepository) {
        self.save_repositories
            .push(TaskAssignmentRepositoryVariant::LocalSqlite(sqlite_repo));
    }


    pub fn add_automerge_for_save(
        &mut self,
        automerge_repo: TaskAssignmentLocalAutomergeRepository,
    ) {
        self.save_repositories
            .push(TaskAssignmentRepositoryVariant::LocalAutomerge(
                automerge_repo,
            ));
    }


    pub fn add_sqlite_for_search(&mut self, sqlite_repo: TaskAssignmentLocalSqliteRepository) {
        self.search_repositories
            .push(TaskAssignmentRepositoryVariant::LocalSqlite(sqlite_repo));
    }


    pub fn add_automerge_for_search(
        &mut self,
        automerge_repo: TaskAssignmentLocalAutomergeRepository,
    ) {
        self.search_repositories
            .push(TaskAssignmentRepositoryVariant::LocalAutomerge(
                automerge_repo,
            ));
    }


    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(TaskAssignmentRepositoryVariant::Web(web_repo));
    }


    pub fn add_web_for_search(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.search_repositories.push(TaskAssignmentRepositoryVariant::Web(web_repo));
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

impl TaskAssignmentRepositoryTrait for TaskAssignmentUnifiedRepository {}

#[async_trait]
impl ProjectRelationRepository<TaskAssignment, TaskId, UserId> for TaskAssignmentUnifiedRepository {

    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Adding task assignment - project: {}, task: {}, user: {}",
            project_id, parent_id, child_id
        );

        for repository in &self.save_repositories {
            repository.add(project_id, parent_id, child_id).await?;
        }

        Ok(())
    }


    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing task assignment - project: {}, task: {}, user: {}",
            project_id, parent_id, child_id
        );

        for repository in &self.save_repositories {
            repository.remove(project_id, parent_id, child_id).await?;
        }

        Ok(())
    }


    async fn remove_all(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing all task assignments for task - project: {}, task: {}",
            project_id, parent_id
        );

        for repository in &self.save_repositories {
            repository.remove_all(project_id, parent_id).await?;
        }

        Ok(())
    }


    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        info!(
            "Finding task assignments - project: {}, task: {}",
            project_id, parent_id
        );

        if let Some(repository) = self.search_repositories.first() {
            repository.find_relations(project_id, parent_id).await
        } else {
            Ok(Vec::new())
        }
    }


    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskAssignment>, RepositoryError> {
        info!("Finding all task assignments in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.find_all(project_id).await
        } else {
            Ok(Vec::new())
        }
    }


    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<bool, RepositoryError> {
        info!(
            "Checking if task assignments exist - project: {}, task: {}",
            project_id, parent_id
        );

        for repository in &self.search_repositories {
            if repository.exists(project_id, parent_id).await? {
                return Ok(true);
            }
        }

        Ok(false)
    }


    async fn count(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
    ) -> Result<u64, RepositoryError> {
        info!(
            "Counting task assignments for task - project: {}, task: {}",
            project_id, parent_id
        );

        if let Some(repository) = self.search_repositories.first() {
            repository.count(project_id, parent_id).await
        } else {
            Ok(0)
        }
    }


    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &UserId,
    ) -> Result<Option<TaskAssignment>, RepositoryError> {
        info!(
            "Finding specific task assignment - project: {}, task: {}, user: {}",
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
