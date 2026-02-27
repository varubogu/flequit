//! タスク繰り返しルール関連付け用統合リポジトリ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use tracing::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::task_recurrence::TaskRecurrenceLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::task_recurrence::TaskRecurrenceLocalSqliteRepository;
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, TaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::task_recurrence_repository_trait::TaskRecurrenceRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum TaskRecurrenceRepositoryVariant {
    LocalSqlite(TaskRecurrenceLocalSqliteRepository),
    LocalAutomerge(TaskRecurrenceLocalAutomergeRepository),
}

impl TaskRecurrenceRepositoryTrait for TaskRecurrenceRepositoryVariant {}

#[async_trait]
impl ProjectRelationRepository<TaskRecurrence, TaskId, RecurrenceRuleId>
    for TaskRecurrenceRepositoryVariant
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => {
                repo.add(project_id, parent_id, child_id, user_id, timestamp)
                    .await
            }
            Self::LocalAutomerge(repo) => {
                repo.add(project_id, parent_id, child_id, user_id, timestamp)
                    .await
            }
        }
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
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
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relations(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.find_relations(project_id, parent_id).await,
        }
    }

    async fn find_all(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
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
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<TaskRecurrence>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relation(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.find_relation(project_id, parent_id, child_id).await,
        }
    }
}

#[derive(Debug)]
pub struct TaskRecurrenceUnifiedRepository {
    save_repositories: Vec<TaskRecurrenceRepositoryVariant>,
    search_repositories: Vec<TaskRecurrenceRepositoryVariant>,
}

impl Default for TaskRecurrenceUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl TaskRecurrenceUnifiedRepository {
    pub fn new(
        save_repositories: Vec<TaskRecurrenceRepositoryVariant>,
        search_repositories: Vec<TaskRecurrenceRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    pub fn add_sqlite_for_save(&mut self, sqlite_repo: TaskRecurrenceLocalSqliteRepository) {
        self.save_repositories
            .push(TaskRecurrenceRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_save(
        &mut self,
        automerge_repo: TaskRecurrenceLocalAutomergeRepository,
    ) {
        self.save_repositories
            .push(TaskRecurrenceRepositoryVariant::LocalAutomerge(
                automerge_repo,
            ));
    }

    pub fn add_sqlite_for_search(&mut self, sqlite_repo: TaskRecurrenceLocalSqliteRepository) {
        self.search_repositories
            .push(TaskRecurrenceRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_search(
        &mut self,
        automerge_repo: TaskRecurrenceLocalAutomergeRepository,
    ) {
        self.search_repositories
            .push(TaskRecurrenceRepositoryVariant::LocalAutomerge(
                automerge_repo,
            ));
    }

    pub fn save_repositories_count(&self) -> usize {
        self.save_repositories.len()
    }

    pub fn search_repositories_count(&self) -> usize {
        self.search_repositories.len()
    }
}

impl TaskRecurrenceRepositoryTrait for TaskRecurrenceUnifiedRepository {}

#[async_trait]
impl ProjectRelationRepository<TaskRecurrence, TaskId, RecurrenceRuleId>
    for TaskRecurrenceUnifiedRepository
{
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        info!(
            "Adding task recurrence relation - project: {}, task: {}, rule: {}",
            project_id, parent_id, child_id
        );

        info!(
            "TaskRecurrenceUnifiedRepository::add - save_repositories count: {}",
            self.save_repositories.len()
        );

        for (i, repository) in self.save_repositories.iter().enumerate() {
            info!(
                "TaskRecurrenceUnifiedRepository::add - calling repository {}: {:?}",
                i,
                std::any::type_name_of_val(repository)
            );
            repository
                .add(project_id, parent_id, child_id, user_id, timestamp)
                .await?;
            info!(
                "TaskRecurrenceUnifiedRepository::add - repository {} completed",
                i
            );
        }

        Ok(())
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &TaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing task recurrence relation - project: {}, task: {}, rule: {}",
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
            "Removing all recurrence relations for task - project: {}, task: {}",
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
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        info!(
            "Finding task recurrence relations - project: {}, task: {}",
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
    ) -> Result<Vec<TaskRecurrence>, RepositoryError> {
        info!(
            "Finding all task recurrence relations in project: {}",
            project_id
        );

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
            "Checking if task recurrence relation exists - project: {}, task: {}",
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
            "Counting task recurrence relations for task - project: {}, task: {}",
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
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<TaskRecurrence>, RepositoryError> {
        info!(
            "Finding specific task recurrence relation - project: {}, task: {}, rule: {}",
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
