use async_trait::async_trait;
use flequit_model::{
    models::task_projects::weekday_condition::WeekdayCondition, types::id_types::WeekdayConditionId,
};

use crate::project_repository_trait::ProjectRepository;

/// 曜日条件リポジトリのトレイト
#[async_trait]
pub trait WeekdayConditionRepositoryTrait:
    ProjectRepository<WeekdayCondition, WeekdayConditionId> + Send + Sync
{
}
