use crate::repositories::core::CoreRepositoryTrait;

pub mod project_repository;
pub mod task_repository;
pub mod subtask_repository;
pub mod tag_repository;
pub mod user_repository;

pub struct WebRepository {}

impl CoreRepositoryTrait for WebRepository {
}
