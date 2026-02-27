use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_core::ports::infrastructure_repositories::{
    AutomergeProjectRepositoryPort, AutomergeRepositoriesPort, TagBookmarkAutomergeRepositoryPort,
};
use flequit_model::models::task_projects::project::Project;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::models::task_projects::task::Task;
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::types::id_types::{ProjectId, TagId, TaskId, TaskListId, UserId};
use flequit_types::errors::repository_error::RepositoryError;

use crate::infrastructure::local_automerge_repositories::LocalAutomergeRepositories;
use crate::infrastructure::task_projects::project::{
    ProjectDocument, ProjectLocalAutomergeRepository,
};
use crate::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalAutomergeRepository;

#[async_trait]
impl TagBookmarkAutomergeRepositoryPort for TagBookmarkLocalAutomergeRepository {
    async fn create(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        self.create(bookmark).await
    }

    async fn update(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        self.update(bookmark).await
    }

    async fn delete(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.delete(user_id, project_id, tag_id).await
    }
}

#[async_trait]
impl AutomergeProjectRepositoryPort for ProjectLocalAutomergeRepository {
    type Snapshot = ProjectDocument;

    async fn create_snapshot(
        &self,
        project_id: &ProjectId,
    ) -> Result<Self::Snapshot, RepositoryError> {
        self.create_snapshot(project_id).await
    }

    async fn restore_from_snapshot(
        &self,
        project_id: &ProjectId,
        snapshot: &Self::Snapshot,
    ) -> Result<(), RepositoryError> {
        self.restore_from_snapshot(project_id, snapshot).await
    }

    async fn mark_project_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.mark_project_deleted(project_id, user_id, timestamp)
            .await
    }

    async fn mark_all_tasks_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.mark_all_tasks_deleted(project_id, user_id, timestamp)
            .await
    }

    async fn mark_all_tags_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.mark_all_tags_deleted(project_id, user_id, timestamp)
            .await
    }

    async fn mark_all_task_lists_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.mark_all_task_lists_deleted(project_id, user_id, timestamp)
            .await
    }

    async fn mark_task_deleted(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.mark_task_deleted(project_id, task_id, user_id, timestamp)
            .await
    }

    async fn mark_tag_deleted(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.mark_tag_deleted(project_id, tag_id, user_id, timestamp)
            .await
    }

    async fn mark_task_list_deleted(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.mark_task_list_deleted(project_id, task_list_id, user_id, timestamp)
            .await
    }

    async fn restore_project(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.restore_project(project_id, user_id, timestamp).await
    }

    async fn restore_all_tasks(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.restore_all_tasks(project_id, user_id, timestamp).await
    }

    async fn restore_all_tags(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.restore_all_tags(project_id, user_id, timestamp).await
    }

    async fn restore_all_task_lists(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.restore_all_task_lists(project_id, user_id, timestamp)
            .await
    }

    async fn restore_task(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.restore_task(project_id, task_id, user_id, timestamp)
            .await
    }

    async fn restore_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.restore_tag(project_id, tag_id, user_id, timestamp)
            .await
    }

    async fn restore_task_list(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError> {
        self.restore_task_list(project_id, task_list_id, user_id, timestamp)
            .await
    }

    async fn get_deleted_project(
        &self,
        project_id: &ProjectId,
    ) -> Result<Option<Project>, RepositoryError> {
        self.get_deleted_project(project_id).await
    }

    async fn get_deleted_tasks(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<Task>, RepositoryError> {
        self.get_deleted_tasks(project_id).await
    }

    async fn get_deleted_tags(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError> {
        self.get_deleted_tags(project_id).await
    }

    async fn get_deleted_task_lists(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskList>, RepositoryError> {
        self.get_deleted_task_lists(project_id).await
    }

    async fn get_deleted_task_by_id(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<Option<Task>, RepositoryError> {
        self.get_deleted_task_by_id(project_id, task_id).await
    }

    async fn get_deleted_tag_by_id(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Option<Tag>, RepositoryError> {
        self.get_deleted_tag_by_id(project_id, tag_id).await
    }

    async fn get_deleted_task_list_by_id(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
    ) -> Result<Option<TaskList>, RepositoryError> {
        self.get_deleted_task_list_by_id(project_id, task_list_id)
            .await
    }
}

impl AutomergeRepositoriesPort for LocalAutomergeRepositories {
    type ProjectsRepository = ProjectLocalAutomergeRepository;

    fn projects_repo(&self) -> &Self::ProjectsRepository {
        &self.projects
    }
}
