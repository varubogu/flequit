//! タスクタグ用統合リポジトリ

use async_trait::async_trait;
use log::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::task_tag::TaskTagLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::task_tag::TaskTagLocalSqliteRepository;
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_tag_repository_trait::TaskTagRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum TaskTagRepositoryVariant {
    LocalSqlite(TaskTagLocalSqliteRepository),
    LocalAutomerge(TaskTagLocalAutomergeRepository),
}

impl TaskTagRepositoryTrait for TaskTagRepositoryVariant {}

#[async_trait]
impl ProjectRelationRepository<TaskTag, TaskId, TagId> for TaskTagRepositoryVariant {

    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
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
        child_id: &TagId,
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
    ) -> Result<Vec<TaskTag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relations(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.find_relations(project_id, parent_id).await,
        }
    }


    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<TaskTag>, RepositoryError> {
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
        child_id: &TagId,
    ) -> Result<Option<TaskTag>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relation(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.find_relation(project_id, parent_id, child_id).await,
        }
    }
}

#[derive(Debug)]
pub struct TaskTagUnifiedRepository {
    save_repositories: Vec<TaskTagRepositoryVariant>,
    search_repositories: Vec<TaskTagRepositoryVariant>,
}

impl Default for TaskTagUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl TaskTagUnifiedRepository {

    pub fn new(
        save_repositories: Vec<TaskTagRepositoryVariant>,
        search_repositories: Vec<TaskTagRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }


    pub fn add_sqlite_for_save(&mut self, sqlite_repo: TaskTagLocalSqliteRepository) {
        self.save_repositories
            .push(TaskTagRepositoryVariant::LocalSqlite(sqlite_repo));
    }


    pub fn add_automerge_for_save(&mut self, automerge_repo: TaskTagLocalAutomergeRepository) {
        self.save_repositories
            .push(TaskTagRepositoryVariant::LocalAutomerge(automerge_repo));
    }


    pub fn add_sqlite_for_search(&mut self, sqlite_repo: TaskTagLocalSqliteRepository) {
        self.search_repositories
            .push(TaskTagRepositoryVariant::LocalSqlite(sqlite_repo));
    }


    pub fn add_automerge_for_search(&mut self, automerge_repo: TaskTagLocalAutomergeRepository) {
        self.search_repositories
            .push(TaskTagRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn save_repositories_count(&self) -> usize {
        self.save_repositories.len()
    }

    pub fn search_repositories_count(&self) -> usize {
        self.search_repositories.len()
    }
}

impl TaskTagRepositoryTrait for TaskTagUnifiedRepository {}

#[async_trait]
impl ProjectRelationRepository<TaskTag, TaskId, TagId> for TaskTagUnifiedRepository {

    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Adding task tag relation - project: {}, task: {}, tag: {}",
            project_id, parent_id, child_id
        );

        info!(
            "TaskTagUnifiedRepository::add - save_repositories count: {}",
            self.save_repositories.len()
        );

        for (i, repository) in self.save_repositories.iter().enumerate() {
            info!("TaskTagUnifiedRepository::add - calling repository {}: {:?}", i, std::any::type_name_of_val(repository));
            repository.add(project_id, parent_id, child_id).await?;
            info!("TaskTagUnifiedRepository::add - repository {} completed", i);
        }

        Ok(())
    }


    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &TagId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing task tag relation - project: {}, task: {}, tag: {}",
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
            "Removing all task tags for task - project: {}, task: {}",
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
    ) -> Result<Vec<TaskTag>, RepositoryError> {
        info!(
            "Finding task tags - project: {}, task: {}",
            project_id, parent_id
        );

        if let Some(repository) = self.search_repositories.first() {
            repository.find_relations(project_id, parent_id).await
        } else {
            Ok(Vec::new())
        }
    }


    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<TaskTag>, RepositoryError> {
        info!("Finding all task tags in project: {}", project_id);

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
            "Checking if task tags exist - project: {}, task: {}",
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
            "Counting task tags for task - project: {}, task: {}",
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
        child_id: &TagId,
    ) -> Result<Option<TaskTag>, RepositoryError> {
        info!(
            "Finding specific task tag relation - project: {}, task: {}, tag: {}",
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
