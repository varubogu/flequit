pub mod local_automerge;
pub mod local_sqlite;
// pub mod cloud_automerge;
// pub mod web;

pub mod account_repository_trait;
pub mod base_repository_trait;
pub mod project_repository_trait;
pub mod setting_repository_trait;
pub mod sub_task_repository_trait;
pub mod tag_repository_trait;
pub mod task_list_repository_trait;
pub mod task_repository_trait;
pub mod unified;
pub mod user_repository_trait;

use project_repository_trait::ProjectRepositoryTrait;
use sub_task_repository_trait::SubTaskRepositoryTrait;
use tag_repository_trait::TagRepositoryTrait;
use task_repository_trait::TaskRepositoryTrait;
use user_repository_trait::UserRepositoryTrait;

pub trait CoreRepositoryTrait<
    TProjectRepositoryTrait,
    TSubTaskRepositoryTrait,
    TTaskRepositoryTrait,
    TTagRepositoryTrait,
    TUserRepositoryTrait,
>:
    ProjectRepositoryTrait
    + SubTaskRepositoryTrait
    + TaskRepositoryTrait
    + TagRepositoryTrait
    + UserRepositoryTrait
    + Send
    + Sync
{
}
