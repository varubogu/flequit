use crate::{
    repositories::core::{
        project_repository_trait::ProjectRepositoryTrait,
        subtask_repository_trait::SubtaskRepositoryTrait,
        tag_repository_trait::TagRepositoryTrait,
        task_repository_trait::TaskRepositoryTrait,
        user_repository_trait::UserRepositoryTrait
    },
};

pub mod project_repository_trait;
pub mod task_repository_trait;
pub mod subtask_repository_trait;
pub mod tag_repository_trait;
pub mod user_repository_trait;

pub trait CoreRepositoryTrait:
    ProjectRepositoryTrait
    + SubtaskRepositoryTrait
    + TaskRepositoryTrait
    + TagRepositoryTrait
    + UserRepositoryTrait
    + Send
    + Sync {}
