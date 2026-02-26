use async_trait::async_trait;
use chrono::{DateTime, Utc};
use flequit_model::models::accounts::account::Account;
use flequit_model::models::task_projects::project::Project;
use flequit_model::models::task_projects::recurrence_rule::RecurrenceRule;
use flequit_model::models::task_projects::subtask::SubTask;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::models::task_projects::subtask_recurrence::SubTaskRecurrence;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::models::task_projects::tag::Tag;
use flequit_model::models::task_projects::task::Task;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::models::task_projects::task_list::TaskList;
use flequit_model::models::task_projects::task_recurrence::TaskRecurrence;
use flequit_model::models::task_projects::task_tag::TaskTag;
use flequit_model::models::user_preferences::tag_bookmark::TagBookmark;
use flequit_model::models::users::user::User;
use flequit_model::types::id_types::{
    AccountId, ProjectId, RecurrenceRuleId, SubTaskId, TagBookmarkId, TagId, TaskId, TaskListId,
    UserId,
};
use flequit_repository::repositories::base_repository_trait::Repository;
use flequit_repository::repositories::patchable_trait::Patchable;
use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
use flequit_repository::repositories::project_relation_repository_trait::ProjectRelationRepository;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::repository_error::RepositoryError;
use sea_orm::DatabaseTransaction;
use std::sync::Arc;
use tokio::sync::RwLock;

#[async_trait]
pub trait TagRepositoryExt: Send + Sync {
    async fn delete_with_relations(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait TagBookmarkSqliteRepositoryPort: Send + Sync {
    async fn create(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError>;
    async fn find_by_id(&self, id: &TagBookmarkId) -> Result<Option<TagBookmark>, RepositoryError>;
    async fn find_by_user_project_tag(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Option<TagBookmark>, RepositoryError>;
    async fn find_by_user_and_project(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<Vec<TagBookmark>, RepositoryError>;
    async fn find_by_user(&self, user_id: &UserId) -> Result<Vec<TagBookmark>, RepositoryError>;
    async fn find_by_project_and_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Vec<TagBookmark>, RepositoryError>;
    async fn update(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError>;
    async fn update_bulk(&self, bookmarks: &[TagBookmark]) -> Result<(), RepositoryError>;
    async fn delete(&self, id: &TagBookmarkId) -> Result<(), RepositoryError>;
    async fn get_max_order_index(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
    ) -> Result<i32, RepositoryError>;
}

#[async_trait]
pub trait TagBookmarkAutomergeRepositoryPort: Send + Sync {
    async fn create(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError>;
    async fn update(&self, bookmark: &TagBookmark) -> Result<(), RepositoryError>;
    async fn delete(
        &self,
        user_id: &UserId,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteProjectRepositoryPort: Send + Sync {
    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        id: &ProjectId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteTaskListRepositoryPort: Send + Sync {
    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        id: &TaskListId,
    ) -> Result<(), RepositoryError>;
    async fn remove_all_by_project_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteTaskRepositoryPort: Send + Sync {
    async fn find_ids_by_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskId>, RepositoryError>;
    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        id: &TaskId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteSubTaskRepositoryPort: Send + Sync {
    async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        task_id: &str,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteTagRepositoryPort: Send + Sync {
    async fn find_ids_by_project_id(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TagId>, RepositoryError>;
    async fn delete_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteTaskTagRepositoryPort: Send + Sync {
    async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError>;
    async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteTaskAssignmentRepositoryPort: Send + Sync {
    async fn remove_all_by_task_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteTaskRecurrenceRepositoryPort: Send + Sync {
    async fn remove_all_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteSubtaskTagRepositoryPort: Send + Sync {
    async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError>;
}

#[async_trait]
pub trait SqliteTagBookmarkRepositoryPort: Send + Sync {
    async fn remove_all_by_tag_id_with_txn(
        &self,
        txn: &DatabaseTransaction,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<(), RepositoryError>;
}

pub trait SqliteRepositoriesPort: Send + Sync {
    type ProjectsRepository: SqliteProjectRepositoryPort;
    type TaskListsRepository: SqliteTaskListRepositoryPort;
    type TasksRepository: SqliteTaskRepositoryPort;
    type SubTasksRepository: SqliteSubTaskRepositoryPort;
    type TagsRepository: SqliteTagRepositoryPort;
    type TaskTagsRepository: SqliteTaskTagRepositoryPort;
    type TaskAssignmentsRepository: SqliteTaskAssignmentRepositoryPort;
    type TaskRecurrencesRepository: SqliteTaskRecurrenceRepositoryPort;
    type SubtaskTagsRepository: SqliteSubtaskTagRepositoryPort;
    type TagBookmarksRepository: SqliteTagBookmarkRepositoryPort;

    fn projects_repo(&self) -> &Self::ProjectsRepository;
    fn task_lists_repo(&self) -> &Self::TaskListsRepository;
    fn tasks_repo(&self) -> &Self::TasksRepository;
    fn sub_tasks_repo(&self) -> &Self::SubTasksRepository;
    fn tags_repo(&self) -> &Self::TagsRepository;
    fn task_tags_repo(&self) -> &Self::TaskTagsRepository;
    fn task_assignments_repo(&self) -> &Self::TaskAssignmentsRepository;
    fn task_recurrences_repo(&self) -> &Self::TaskRecurrencesRepository;
    fn subtask_tags_repo(&self) -> &Self::SubtaskTagsRepository;
    fn tag_bookmarks_repo(&self) -> &Self::TagBookmarksRepository;
}

#[async_trait]
pub trait AutomergeProjectRepositoryPort: Send + Sync {
    type Snapshot: Clone + Send + Sync;

    async fn create_snapshot(&self, project_id: &ProjectId) -> Result<Self::Snapshot, RepositoryError>;
    async fn restore_from_snapshot(
        &self,
        project_id: &ProjectId,
        snapshot: &Self::Snapshot,
    ) -> Result<(), RepositoryError>;

    async fn mark_project_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn mark_all_tasks_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn mark_all_tags_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn mark_all_task_lists_deleted(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn mark_task_deleted(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn mark_tag_deleted(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn mark_task_list_deleted(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;

    async fn restore_project(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn restore_all_tasks(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn restore_all_tags(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn restore_all_task_lists(
        &self,
        project_id: &ProjectId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn restore_task(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn restore_tag(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;
    async fn restore_task_list(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
        user_id: &UserId,
        timestamp: &DateTime<Utc>,
    ) -> Result<(), RepositoryError>;

    async fn get_deleted_project(&self, project_id: &ProjectId) -> Result<Option<Project>, RepositoryError>;
    async fn get_deleted_tasks(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError>;
    async fn get_deleted_tags(&self, project_id: &ProjectId) -> Result<Vec<Tag>, RepositoryError>;
    async fn get_deleted_task_lists(
        &self,
        project_id: &ProjectId,
    ) -> Result<Vec<TaskList>, RepositoryError>;
    async fn get_deleted_task_by_id(
        &self,
        project_id: &ProjectId,
        task_id: &TaskId,
    ) -> Result<Option<Task>, RepositoryError>;
    async fn get_deleted_tag_by_id(
        &self,
        project_id: &ProjectId,
        tag_id: &TagId,
    ) -> Result<Option<Tag>, RepositoryError>;
    async fn get_deleted_task_list_by_id(
        &self,
        project_id: &ProjectId,
        task_list_id: &TaskListId,
    ) -> Result<Option<TaskList>, RepositoryError>;
}

pub trait AutomergeRepositoriesPort: Send + Sync {
    type ProjectsRepository: AutomergeProjectRepositoryPort;

    fn projects_repo(&self) -> &Self::ProjectsRepository;
}

#[async_trait]
pub trait InfrastructureRepositoriesTrait: Send + Sync + std::fmt::Debug {
    type AccountsRepository: Repository<Account, AccountId> + Send + Sync;
    type ProjectsRepository:
        Repository<Project, ProjectId> + Patchable<Project, ProjectId> + Send + Sync;
    type TagsRepository: ProjectRepository<Tag, TagId> + TagRepositoryExt + Send + Sync;
    type TasksRepository: ProjectPatchable<Task, TaskId> + Send + Sync;
    type TaskListsRepository: ProjectPatchable<TaskList, TaskListId> + Send + Sync;
    type SubTasksRepository: ProjectPatchable<SubTask, SubTaskId> + Send + Sync;
    type UsersRepository: Repository<User, UserId> + Send + Sync;
    type RecurrenceRulesRepository:
        ProjectPatchable<RecurrenceRule, RecurrenceRuleId> + Send + Sync;
    type TaskAssignmentsRepository:
        ProjectRelationRepository<TaskAssignment, TaskId, UserId> + Send + Sync;
    type SubtaskAssignmentsRepository:
        ProjectRelationRepository<SubTaskAssignment, SubTaskId, UserId> + Send + Sync;
    type TaskTagsRepository: ProjectRelationRepository<TaskTag, TaskId, TagId> + Send + Sync;
    type SubtaskTagsRepository:
        ProjectRelationRepository<SubTaskTag, SubTaskId, TagId> + Send + Sync;
    type TaskRecurrencesRepository:
        ProjectRelationRepository<TaskRecurrence, TaskId, RecurrenceRuleId> + Send + Sync;
    type SubtaskRecurrencesRepository:
        ProjectRelationRepository<SubTaskRecurrence, SubTaskId, RecurrenceRuleId> + Send + Sync;

    type TagBookmarksSqliteRepository: TagBookmarkSqliteRepositoryPort;
    type TagBookmarksAutomergeRepository: TagBookmarkAutomergeRepositoryPort;

    type SqliteRepositories: SqliteRepositoriesPort;
    type AutomergeRepositories: AutomergeRepositoriesPort;

    fn accounts(&self) -> &Self::AccountsRepository;
    fn projects(&self) -> &Self::ProjectsRepository;
    fn tags(&self) -> &Self::TagsRepository;
    fn tasks(&self) -> &Self::TasksRepository;
    fn task_lists(&self) -> &Self::TaskListsRepository;
    fn sub_tasks(&self) -> &Self::SubTasksRepository;
    fn users(&self) -> &Self::UsersRepository;
    fn recurrence_rules(&self) -> &Self::RecurrenceRulesRepository;
    fn task_assignments(&self) -> &Self::TaskAssignmentsRepository;
    fn subtask_assignments(&self) -> &Self::SubtaskAssignmentsRepository;
    fn task_tags(&self) -> &Self::TaskTagsRepository;
    fn subtask_tags(&self) -> &Self::SubtaskTagsRepository;
    fn task_recurrences(&self) -> &Self::TaskRecurrencesRepository;
    fn subtask_recurrences(&self) -> &Self::SubtaskRecurrencesRepository;

    fn tag_bookmarks_sqlite(&self) -> &Self::TagBookmarksSqliteRepository;
    fn tag_bookmarks_automerge(&self) -> &Self::TagBookmarksAutomergeRepository;

    fn sqlite_repositories(&self) -> Option<&Arc<RwLock<Self::SqliteRepositories>>>;
    fn automerge_repositories(&self) -> Option<&Arc<RwLock<Self::AutomergeRepositories>>>;

    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>>;
    async fn cleanup(&mut self) -> Result<(), Box<dyn std::error::Error>>;
}
