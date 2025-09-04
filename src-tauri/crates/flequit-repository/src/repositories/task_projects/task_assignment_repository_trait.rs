//! タスク割り当てリポジトリトレイト

use async_trait::async_trait;
use flequit_model::models::task_projects::task_assignment::TaskAssignment;
use flequit_model::types::id_types::{TaskId, UserId};

use crate::repositories::base_repository_trait::RelationRepository;

#[async_trait]
pub trait TaskAssignmentRepositoryTrait: RelationRepository<TaskAssignment, TaskId, UserId> {
}
