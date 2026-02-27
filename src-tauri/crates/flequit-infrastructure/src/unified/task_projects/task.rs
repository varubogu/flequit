//! タスク用統合リポジトリ

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use tracing::{error, info};

use flequit_infrastructure_automerge::infrastructure::task_projects::task::TaskLocalAutomergeRepository;
use flequit_infrastructure_sqlite::infrastructure::task_projects::task::TaskLocalSqliteRepository;
use flequit_model::models::task_projects::task::Task;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_repository::repositories::task_projects::task_repository_trait::TaskRepositoryTrait;
use flequit_types::errors::repository_error::RepositoryError;

#[derive(Debug)]
pub enum TaskRepositoryVariant {
    LocalSqlite(TaskLocalSqliteRepository),
    LocalAutomerge(TaskLocalAutomergeRepository),
}

impl TaskRepositoryTrait for TaskRepositoryVariant {}

impl ProjectPatchable<Task, TaskId> for TaskRepositoryVariant {}

#[async_trait]
impl ProjectRepository<Task, TaskId> for TaskRepositoryVariant {
    async fn save(
        &self,
        project_id: &ProjectId,
        entity: &Task,
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
        id: &TaskId,
    ) -> Result<Option<Task>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_by_id(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.find_by_id(project_id, id).await,
        }
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.find_all(project_id).await,
            Self::LocalAutomerge(repo) => repo.find_all(project_id).await,
        }
    }

    async fn delete(&self, project_id: &ProjectId, id: &TaskId) -> Result<(), RepositoryError> {
        match self {
            Self::LocalSqlite(repo) => repo.delete(project_id, id).await,
            Self::LocalAutomerge(repo) => repo.delete(project_id, id).await,
        }
    }

    async fn exists(&self, project_id: &ProjectId, id: &TaskId) -> Result<bool, RepositoryError> {
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
pub struct TaskUnifiedRepository {
    save_repositories: Vec<TaskRepositoryVariant>,
    search_repositories: Vec<TaskRepositoryVariant>,
}

impl Default for TaskUnifiedRepository {
    fn default() -> Self {
        Self::new(vec![], vec![])
    }
}

impl TaskUnifiedRepository {
    pub fn new(
        save_repositories: Vec<TaskRepositoryVariant>,
        search_repositories: Vec<TaskRepositoryVariant>,
    ) -> Self {
        Self {
            save_repositories,
            search_repositories,
        }
    }

    pub fn add_sqlite_for_save(&mut self, sqlite_repo: TaskLocalSqliteRepository) {
        self.save_repositories
            .push(TaskRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_save(&mut self, automerge_repo: TaskLocalAutomergeRepository) {
        self.save_repositories
            .push(TaskRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn add_sqlite_for_search(&mut self, sqlite_repo: TaskLocalSqliteRepository) {
        self.search_repositories
            .push(TaskRepositoryVariant::LocalSqlite(sqlite_repo));
    }

    pub fn add_automerge_for_search(&mut self, automerge_repo: TaskLocalAutomergeRepository) {
        self.search_repositories
            .push(TaskRepositoryVariant::LocalAutomerge(automerge_repo));
    }

    pub fn add_web_for_save(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.save_repositories.push(TaskRepositoryVariant::Web(web_repo));
    }

    pub fn add_web_for_search(&mut self, _web_repo: impl std::fmt::Debug + Send + Sync + 'static) {
        // 将来のWeb実装用の拡張ポイント
        // self.search_repositories.push(TaskRepositoryVariant::Web(web_repo));
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

impl TaskRepositoryTrait for TaskUnifiedRepository {}

impl ProjectPatchable<Task, TaskId> for TaskUnifiedRepository {}

#[async_trait]
impl ProjectRepository<Task, TaskId> for TaskUnifiedRepository {
    async fn save(
        &self,
        project_id: &ProjectId,
        entity: &Task,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        info!(
            "Saving task entity with ID: {} in project: {}",
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
        id: &TaskId,
    ) -> Result<Option<Task>, RepositoryError> {
        info!("Finding task by ID: {} in project: {}", id, project_id);

        for repository in &self.search_repositories {
            if let Some(entity) = repository.find_by_id(project_id, id).await? {
                return Ok(Some(entity));
            }
        }

        Ok(None)
    }

    async fn find_all(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError> {
        info!("Finding all tasks in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.find_all(project_id).await
        } else {
            Ok(vec![])
        }
    }

    async fn delete(&self, project_id: &ProjectId, id: &TaskId) -> Result<(), RepositoryError> {
        info!("Deleting task with ID: {} in project: {}", id, project_id);

        // 削除前に全リポジトリでデータの存在を確認
        let mut existence_status = Vec::new();
        for (idx, repository) in self.save_repositories.iter().enumerate() {
            let exists = repository.exists(project_id, id).await?;
            existence_status.push((idx, exists));
            info!("Repository {} - Task {} existence: {}", idx, id, exists);
        }

        // 少なくとも1つのリポジトリにデータが存在することを確認
        let any_exists = existence_status.iter().any(|(_, exists)| *exists);
        if !any_exists {
            return Err(RepositoryError::NotFound(format!(
                "Task not found in any repository: {}",
                id
            )));
        }

        // トランザクション的な削除処理
        // ステップ1: 全リポジトリから削除を試みる
        let mut deleted_repos = Vec::new();
        for (idx, repository) in self.save_repositories.iter().enumerate() {
            match repository.delete(project_id, id).await {
                Ok(()) => {
                    info!("Successfully deleted task {} from repository {}", id, idx);
                    deleted_repos.push(idx);
                }
                Err(e) => {
                    error!(
                        "Failed to delete task {} from repository {}: {:?}",
                        id, idx, e
                    );
                    // 削除失敗: ロールバック処理
                    error!(
                        "Rolling back deletions due to failure in repository {}",
                        idx
                    );

                    // TODO: ロールバック処理を実装
                    // 現時点では、削除されたデータを復元する機能がないため、
                    // エラーをログに記録して失敗を返す
                    return Err(e);
                }
            }
        }

        info!(
            "Successfully deleted task {} from all {} repositories",
            id,
            deleted_repos.len()
        );
        Ok(())
    }

    async fn exists(&self, project_id: &ProjectId, id: &TaskId) -> Result<bool, RepositoryError> {
        info!(
            "Checking if task exists with ID: {} in project: {}",
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
        info!("Counting tasks in project: {}", project_id);

        if let Some(repository) = self.search_repositories.first() {
            repository.count(project_id).await
        } else {
            Ok(0)
        }
    }
}
