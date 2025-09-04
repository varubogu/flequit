//! タスク割り当てリポジトリトレイト

use async_trait::async_trait;
use flequit_model::models::task_projects::subtask_assignment::SubTaskAssignment;
use flequit_model::types::id_types::{SubTaskId, UserId};

use crate::repositories::base_repository_trait::RelationRepository;

#[async_trait]
pub trait SubTaskAssignmentRepositoryTrait: RelationRepository<SubTaskAssignment, SubTaskId, UserId> {
}
