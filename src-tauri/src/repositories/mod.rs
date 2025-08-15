pub mod local_automerge;
pub mod local_sqlite;
pub mod cloud_automerge;
pub mod web;

pub mod base_repository_trait;
pub mod project_repository_trait;
pub mod repository_factory;
pub mod subtask_repository_trait;
pub mod task_repository_trait;
pub mod tag_repository_trait;
pub mod user_repository_trait;

use project_repository_trait::ProjectRepositoryTrait;
use subtask_repository_trait::SubtaskRepositoryTrait;
use task_repository_trait::TaskRepositoryTrait;
use tag_repository_trait::TagRepositoryTrait;
use user_repository_trait::UserRepositoryTrait;


pub trait CoreRepositoryTrait:
    ProjectRepositoryTrait
    + SubtaskRepositoryTrait
    + TaskRepositoryTrait
    + TagRepositoryTrait
    + UserRepositoryTrait
    + Send
    + Sync {}
