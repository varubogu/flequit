use async_trait::async_trait;
use flequit_core::ports::infrastructure_repositories::{
    SqliteProjectRepositoryPort, SqliteRepositoriesPort, SqliteSubTaskRepositoryPort,
    SqliteSubtaskTagRepositoryPort, SqliteTagBookmarkRepositoryPort, SqliteTagRepositoryPort,
    SqliteTaskAssignmentRepositoryPort, SqliteTaskListRepositoryPort,
    SqliteTaskRecurrenceRepositoryPort, SqliteTaskRepositoryPort, SqliteTaskTagRepositoryPort,
    TagBookmarkSqliteRepositoryPort,
};
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::types::id_types::{ProjectId, TagBookmarkId, TagId, TaskId, TaskListId, UserId};
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::DatabaseTransaction;

use crate::infrastructure::local_sqlite_repositories::LocalSqliteRepositories;
use crate::infrastructure::task_projects::project::ProjectLocalSqliteRepository;
use crate::infrastructure::task_projects::subtask::SubTaskLocalSqliteRepository;
use crate::infrastructure::task_projects::subtask_tag::SubtaskTagLocalSqliteRepository;
use crate::infrastructure::task_projects::tag::TagLocalSqliteRepository;
use crate::infrastructure::task_projects::task::TaskLocalSqliteRepository;
use crate::infrastructure::task_projects::task_assignments::TaskAssignmentLocalSqliteRepository;
use crate::infrastructure::task_projects::task_list::TaskListLocalSqliteRepository;
use crate::infrastructure::task_projects::task_recurrence::TaskRecurrenceLocalSqliteRepository;
use crate::infrastructure::task_projects::task_tag::TaskTagLocalSqliteRepository;
use crate::infrastructure::user_preferences::tag_bookmark::TagBookmarkLocalSqliteRepository;

#[async_trait]
impl TagBookmarkSqliteRepositoryPort for TagBookmarkLocalSqliteRepository {
    async fn create(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        self.create(bookmark).await
    }

    async fn find_by_id(&self, id: &TagBookmarkId) -> Result<Option<TagBookmark>, RepositoryError> {
        self.find_by_id(id).await
    }

    async fn find_by_user_project_tag(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Option<TagBookmark>, RepositoryError> {
        self.find_by_user_project_tag(user_id, project_id, tag_id).await
    }

    async fn find_by_user_and_project(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<Vec<TagBookmark>, RepositoryError> {
        self.find_by_user_and_project(user_id, project_id).await
    }

    async fn find_by_user(&self, user_id: &UserId) -> Result<Vec<TagBookmark>, RepositoryError> {
        self.find_by_user(user_id).await
    }

    async fn find_by_project_and_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Vec<TagBookmark>, RepositoryError> {
        self.find_by_project_and_tag(project_id, tag_id).await
    }

    async fn update(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError> {
        self.update(bookmark).await
    }

    async fn update_bulk(&self, bookmarks: &[TagBookmark]) -> Result<(), RepositoryError> {
        self.update_bulk(bookmarks).await
    }

    async fn delete(&self, id: &TagBookmarkId) -> Result<(), RepositoryError> {
        self.delete(id).await
    }

    async fn get_max_order_index(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<i32, RepositoryError> {
        self.get_max_order_index(user_id, project_id).await
    }
}

#[async_trait]
impl SqliteProjectRepositoryPort for ProjectLocalSqliteRepository {
    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        id: &ProjectId,
    ) -> Result<(), RepositoryError> {
        self.delete_with_txn(txn, id).await
    }
}

#[async_trait]
impl SqliteTaskListRepositoryPort for TaskListLocalSqliteRepository {
    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        id: &TaskListId,
    ) -> Result<(), RepositoryError> {
        self.delete_with_txn(txn, project_id, id).await
    }

    async fn remove_all_by_project_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_by_project_id_with_txn(txn, project_id).await
    }
}

#[async_trait]
impl SqliteTaskRepositoryPort for TaskLocalSqliteRepository {
    async fn find_ids_by_project_id(&self, project_id: &ProjectId) -> Result<Vec<TaskId>, RepositoryError> {
        self.find_ids_by_project_id(project_id).await
    }

    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.delete_with_txn(txn, project_id, id).await
    }
}

#[async_trait]
impl SqliteSubTaskRepositoryPort for SubTaskLocalSqliteRepository {
    async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        task_id: &str,
    ) -> Result<(), RepositoryError> {
        self.remove_all_by_task_id_with_txn(txn, project_id, task_id).await
    }
}

#[async_trait]
impl SqliteTagRepositoryPort for TagLocalSqliteRepository {
    async fn find_ids_by_project_id(&self, project_id: &ProjectId) -> Result<Vec<TagId>, RepositoryError> {
        self.find_ids_by_project_id(project_id).await
    }

    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.delete_with_txn(txn, project_id, tag_id).await
    }
}

#[async_trait]
impl SqliteTaskTagRepositoryPort for TaskTagLocalSqliteRepository {
    async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_by_task_id_with_txn(txn, project_id, task_id).await
    }

    async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_by_tag_id_with_txn(txn, project_id, tag_id).await
    }
}

#[async_trait]
impl SqliteTaskAssignmentRepositoryPort for TaskAssignmentLocalSqliteRepository {
    async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_by_task_id_with_txn(txn, task_id).await
    }
}

#[async_trait]
impl SqliteTaskRecurrenceRepositoryPort for TaskRecurrenceLocalSqliteRepository {
    async fn remove_all_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_with_txn(txn, project_id, task_id).await
    }
}

#[async_trait]
impl SqliteSubtaskTagRepositoryPort for SubtaskTagLocalSqliteRepository {
    async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_by_tag_id_with_txn(txn, tag_id).await
    }
}

#[async_trait]
impl SqliteTagBookmarkRepositoryPort for TagBookmarkLocalSqliteRepository {
    async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError> {
        self.remove_all_by_tag_id_with_txn(txn, project_id, tag_id).await
    }
}

impl SqliteRepositoriesPort for LocalSqliteRepositories {
    type ProjectsRepository = ProjectLocalSqliteRepository;
    type TaskListsRepository = TaskListLocalSqliteRepository;
    type TasksRepository = TaskLocalSqliteRepository;
    type SubTasksRepository = SubTaskLocalSqliteRepository;
    type TagsRepository = TagLocalSqliteRepository;
    type TaskTagsRepository = TaskTagLocalSqliteRepository;
    type TaskAssignmentsRepository = TaskAssignmentLocalSqliteRepository;
    type TaskRecurrencesRepository = TaskRecurrenceLocalSqliteRepository;
    type SubtaskTagsRepository = SubtaskTagLocalSqliteRepository;
    type TagBookmarksRepository = TagBookmarkLocalSqliteRepository;

    fn projects_repo(&self) -> &Self::ProjectsRepository {
        &self.projects
    }

    fn task_lists_repo(&self) -> &Self::TaskListsRepository {
        &self.task_lists
    }

    fn tasks_repo(&self) -> &Self::TasksRepository {
        &self.tasks
    }

    fn sub_tasks_repo(&self) -> &Self::SubTasksRepository {
        &self.sub_tasks
    }

    fn tags_repo(&self) -> &Self::TagsRepository {
        &self.tags
    }

    fn task_tags_repo(&self) -> &Self::TaskTagsRepository {
        &self.task_tags
    }

    fn task_assignments_repo(&self) -> &Self::TaskAssignmentsRepository {
        &self.task_assignments
    }

    fn task_recurrences_repo(&self) -> &Self::TaskRecurrencesRepository {
        &self.task_recurrences
    }

    fn subtask_tags_repo(&self) -> &Self::SubtaskTagsRepository {
        &self.subtask_tags
    }

    fn tag_bookmarks_repo(&self) -> &Self::TagBookmarksRepository {
        &self.tag_bookmarks
    }
}
