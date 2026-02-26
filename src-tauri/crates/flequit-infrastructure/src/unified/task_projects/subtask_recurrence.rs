//! サブタスク繰り返しルール関連付け用統合リポジトリ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use tracing::info;

use flequit_infrastructure_automerge::infrastructure::task_projects::subtask_recurrence::SubtaskRecurrenceLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::subtask_recurrence::SubtaskRecurrenceLocalSqliteRepository;
use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
use flequit_model::types::id_types::{ProjectId, RecurrenceRuleId, SubTaskId, UserId};
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::task_projects::subtask_recurrence_repository_trait::SubtaskRecurrenceRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum SubTaskRecurrenceRepositoryVariant {
    LocalSqlite(SubtaskRecurrenceLocalSqliteRepository),
    LocalAutomerge(SubtaskRecurrenceLocalAutomergeRepository),
}

#[async_trait]
impl SubtaskRecurrenceRepositoryTrait for SubTaskRecurrenceRepositoryVariant {
    async fn find_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        // Not used in our unified pattern - delegates to ProjectRelationRepository
        match self {
            Self::LocalSqlite(repo) => repo.find_by_subtask_id(subtask_id).await,
            Self::LocalAutomerge(repo) => repo.find_by_subtask_id(subtask_id).await,
        }
    }

    async fn find_by_recurrence_rule_id(
        &self,
        recurrence_rule_id: &RecurrenceRuleId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_recurrence_rule_id(recurrence_rule_id).await,
            Self::LocalAutomerge(repo) => repo.find_by_recurrence_rule_id(recurrence_rule_id).await,
        }
    }

    async fn find_all(&self) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => <_ as SubtaskRecurrenceRepositoryTrait>::find_all(repo).await,
            Self::LocalAutomerge(repo) => <_ as SubtaskRecurrenceRepositoryTrait>::find_all(repo).await,
        }
    }

    async fn save(&self, recurrence: &SubTaskRecurrence) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.save(recurrence).await,
            Self::LocalAutomerge(repo) => repo.save(recurrence).await,
        }
    }

    async fn delete_by_subtask_id(&self, subtask_id: &SubTaskId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete_by_subtask_id(subtask_id).await,
            Self::LocalAutomerge(repo) => repo.delete_by_subtask_id(subtask_id).await,
        }
    }

    async fn delete_by_recurrence_rule_id(
        &self,
        recurrence_rule_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete_by_recurrence_rule_id(recurrence_rule_id).await,
            Self::LocalAutomerge(repo) => repo.delete_by_recurrence_rule_id(recurrence_rule_id).await,
        }
    }

    async fn exists_by_subtask_id(&self, subtask_id: &SubTaskId) -> Result<bool, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.exists_by_subtask_id(subtask_id).await,
            Self::LocalAutomerge(repo) => repo.exists_by_subtask_id(subtask_id).await,
        }
    }
}

#[async_trait]
impl ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId> for SubTaskRecurrenceRepositoryVariant {
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.add(project_id, parent_id, child_id, user_id, timestamp).await,
            Self::LocalAutomerge(repo) => repo.add(project_id, parent_id, child_id, user_id, timestamp).await,
        }
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
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
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.remove_all(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.remove_all(project_id, parent_id).await,
        }
    }

    async fn find_relations(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relations(project_id, parent_id).await,
            Self::LocalAutomerge(repo) => repo.find_relations(project_id, parent_id).await,
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => <_ as ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId>>::find_all(repo, project_id).await,
            Self::LocalAutomerge(repo) => <_ as ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId>>::find_all(repo, project_id).await,
        }
    }

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

    async fn find_relation(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_relation(project_id, parent_id, child_id).await,
            Self::LocalAutomerge(repo) => repo.find_relation(project_id, parent_id, child_id).await,
        }
    }
}

#[derive(Debug)]
pub struct SubTaskRecurrenceUnifiedRepository {
    save_repositories: Vec<SubTaskRecurrenceRepositoryVariant>,
    search_repositories: Vec<SubTaskRecurrenceRepositoryVariant>,
}

impl Default for SubTaskRecurrenceUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl SubTaskRecurrenceUnifiedRepository {
    pub fn new(
        save_repositories: Vec<SubTaskRecurrenceRepositoryVariant>,
        search_repositories: Vec<SubTaskRecurrenceRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    pub fn add_sqlite_for_save(&mut self, sqlite_repo: SubtaskRecurrenceLocalSqliteRepository) {
        self.save_repositories
            .push(SubTaskRecurrenceRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_save(&mut self, automerge_repo: SubtaskRecurrenceLocalAutomergeRepository) {
        self.save_repositories
            .push(SubTaskRecurrenceRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn add_sqlite_for_search(&mut self, sqlite_repo: SubtaskRecurrenceLocalSqliteRepository) {
        self.search_repositories
            .push(SubTaskRecurrenceRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_search(&mut self, automerge_repo: SubtaskRecurrenceLocalAutomergeRepository) {
        self.search_repositories
            .push(SubTaskRecurrenceRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn save_repositories_count(&self) -> usize {
        self.save_repositories.len()
    }

    pub fn search_repositories_count(&self) -> usize {
        self.search_repositories.len()
    }
}

#[async_trait]
impl SubtaskRecurrenceRepositoryTrait for SubTaskRecurrenceUnifiedRepository {
    async fn find_by_subtask_id(
        &self,
        subtask_id: &SubTaskId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        if let Some(repository) = self.search_repositories.first() {
            repository.find_by_subtask_id(subtask_id).await
        } else {
            Ok(None)
        }
    }

    async fn find_by_recurrence_rule_id(
        &self,
        recurrence_rule_id: &RecurrenceRuleId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        if let Some(repository) = self.search_repositories.first() {
            repository.find_by_recurrence_rule_id(recurrence_rule_id).await
        } else {
            Ok(Vec::new())
        }
    }

    async fn find_all(&self) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        if let Some(repository) = self.search_repositories.first() {
            <_ as SubtaskRecurrenceRepositoryTrait>::find_all(repository).await
        } else {
            Ok(Vec::new())
        }
    }

    async fn save(&self, recurrence: &SubTaskRecurrence) -> Result<(), RepositoryError> {
        for repository in &self.save_repositories {
            repository.save(recurrence).await?;
        }
        Ok(())
    }

    async fn delete_by_subtask_id(&self, subtask_id: &SubTaskId) -> Result<(), RepositoryError> {
        for repository in &self.save_repositories {
            repository.delete_by_subtask_id(subtask_id).await?;
        }
        Ok(())
    }

    async fn delete_by_recurrence_rule_id(
        &self,
        recurrence_rule_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        for repository in &self.save_repositories {
            repository.delete_by_recurrence_rule_id(recurrence_rule_id).await?;
        }
        Ok(())
    }

    async fn exists_by_subtask_id(&self, subtask_id: &SubTaskId) -> Result<bool, RepositoryError> {
        for repository in &self.search_repositories {
            if repository.exists_by_subtask_id(subtask_id).await? {
                return Ok(true);
            }
        }
        Ok(false)
    }
}

#[async_trait]
impl ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId> for SubTaskRecurrenceUnifiedRepository {
    async fn add(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        info!(
            "Adding subtask recurrence relation - project: {}, subtask: {}, rule: {}",
            project_id, parent_id, child_id
        );

        info!(
            "SubTaskRecurrenceUnifiedRepository::add - save_repositories count: {}",
            self.save_repositories.len()
        );

        for (i, repository) in self.save_repositories.iter().enumerate() {
            info!(
                "SubTaskRecurrenceUnifiedRepository::add - calling repository {}: {:?}",
                i,
                std::any::type_name_of_val(repository)
            );
            repository.add(project_id, parent_id, child_id, user_id, timestamp).await?;
            info!("SubTaskRecurrenceUnifiedRepository::add - repository {} completed", i);
        }

        Ok(())
    }

    async fn remove(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing subtask recurrence relation - project: {}, subtask: {}, rule: {}",
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
        parent_id: &SubTaskId,
    ) -> Result<(), RepositoryError> {
        info!(
            "Removing all recurrence relations for subtask - project: {}, subtask: {}",
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
        parent_id: &SubTaskId,
    ) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        info!(
            "Finding subtask recurrence relations - project: {}, subtask: {}",
            project_id, parent_id
        );

        if let Some(repository) = self.search_repositories.first() {
            repository.find_relations(project_id, parent_id).await
        } else {
            Ok(Vec::new())
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<SubTaskRecurrence>, RepositoryError> {
        info!("Finding all subtask recurrence relations in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            <_ as ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId>>::find_all(repository, project_id).await
        } else {
            Ok(Vec::new())
        }
    }

    async fn exists(
        &self,
        project_id: &ProjectId,
        parent_id: &SubTaskId,
    ) -> Result<bool, RepositoryError> {
        info!(
            "Checking if subtask recurrence relation exists - project: {}, subtask: {}",
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
        parent_id: &SubTaskId,
    ) -> Result<u64, RepositoryError> {
        info!(
            "Counting subtask recurrence relations for subtask - project: {}, subtask: {}",
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
        parent_id: &SubTaskId,
        child_id: &RecurrenceRuleId,
    ) -> Result<Option<SubTaskRecurrence>, RepositoryError> {
        info!(
            "Finding specific subtask recurrence relation - project: {}, subtask: {}, rule: {}",
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
