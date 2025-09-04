//! タスク割り当てリポジトリトレイト

use async_trait::async_trait;
use flequit_model::models::task_projects::subtask_tag::SubTaskTag;
use flequit_model::types::id_types::{TaskId, TagId};

use crate::repositories::base_repository_trait::RelationRepository;

#[async_trait]
pub trait SubTaskTagRepositoryTrait: RelationRepository<SubTaskTag, TaskId, TagId> {
}
