use async_trait::async_trait;
use flequit_model::{
    models::task_projects::date_condition::DateCondition, types::id_types::DateConditionId,
};

use crate::project_repository_trait::ProjectRepository;

/// 日付条件リポジトリのトレイト
#[async_trait]
pub trait DateConditionRepositoryTrait:
    ProjectRepository<DateCondition, DateConditionId> + Send + Sync
{
}
