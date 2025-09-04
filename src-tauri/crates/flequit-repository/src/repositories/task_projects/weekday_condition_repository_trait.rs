use async_trait::async_trait;
use flequit_model::models::task_projects::weekday_condition::WeekdayCondition;
use flequit_types::errors::repository_error::RepositoryError;

/// 曜日条件リポジトリのトレイト
#[async_trait]
pub trait WeekdayConditionRepositoryTrait: Send + Sync {
    /// 指定したIDの曜日条件を取得
    async fn get_weekday_condition(&self, id: &str) -> Result<Option<WeekdayCondition>, RepositoryError>;

    /// すべての曜日条件を取得
    async fn get_all_weekday_conditions(&self) -> Result<Vec<WeekdayCondition>, RepositoryError>;

    /// 曜日条件を新規追加
    async fn add_weekday_condition(&self, condition: &WeekdayCondition) -> Result<(), RepositoryError>;

    /// 曜日条件を更新
    async fn update_weekday_condition(&self, condition: &WeekdayCondition) -> Result<(), RepositoryError>;

    /// 曜日条件を削除
    async fn delete_weekday_condition(&self, id: &str) -> Result<(), RepositoryError>;
}
