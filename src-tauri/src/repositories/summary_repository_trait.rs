use async_trait::async_trait;

use crate::repositories::{
    project_repository_trait::ProjectRepositoryTrait,
    tag_repository_trait::TagRepositoryTrait,
    task_repository_trait::TaskRepositoryTrait,
    user_repository_trait::UserRepositoryTrait,
    sub_task_repository_trait::SubTaskRepositoryTrait,
    task_list_repository_trait::TaskListRepositoryTrait,
};


// pub struct SummaryRepository {
//     pub project: ProjectRepositoryTrait,
//     pub task_list: TaskListRepositoryTrait,
//     pub task: TaskRepositoryTrait,
//     pub sub_task: SubTaskRepositoryTrait,
//     pub tag: TagRepositoryTrait,
//     pub user: UserRepositoryTrait,
// }


#[async_trait]
pub trait SummaryRepositoryTrait:
    ProjectRepositoryTrait
    + TaskListRepositoryTrait
    + TaskRepositoryTrait
    + SubTaskRepositoryTrait
    + TagRepositoryTrait
    + UserRepositoryTrait {
}
