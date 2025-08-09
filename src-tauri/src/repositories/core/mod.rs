pub mod project_repository_trait;
pub mod task_repository_trait;
pub mod subtask_repository_trait;
pub mod tag_repository_trait;
pub mod user_repository_trait;

pub use project_repository_trait::ProjectRepositoryTrait;
pub use task_repository_trait::TaskRepositoryTrait;
pub use subtask_repository_trait::SubtaskRepositoryTrait;
pub use tag_repository_trait::TagRepositoryTrait;
pub use user_repository_trait::UserRepositoryTrait;