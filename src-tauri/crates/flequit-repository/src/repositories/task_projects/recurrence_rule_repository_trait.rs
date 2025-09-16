use async_trait::async_trait;
use flequit_model::{models::task_projects::recurrence_rule::RecurrenceRule, types::id_types::RecurrenceRuleId};

use crate::project_repository_trait::ProjectRepository;

/// 繰り返しルールリポジトリのトレイト
#[async_trait]
pub trait RecurrenceRuleRepositoryTrait:
    ProjectRepository<RecurrenceRule, RecurrenceRuleId> + Send + Sync {
}
