use async_trait::async_trait;
use flequit_model::models::task_projects::date_condition::DateCondition;
use flequit_types::errors::repository_error::RepositoryError;

/// 日付条件リポジトリのトレイト
#[async_trait]
pub trait DateConditionRepositoryTrait: Send + Sync {
    /// 指定したIDの日付条件を取得
    async fn get_date_condition(&self, id: &str) -> Result<Option<DateCondition>, RepositoryError>;

    /// すべての日付条件を取得
    async fn get_all_date_conditions(&self) -> Result<Vec<DateCondition>, RepositoryError>;

    /// 日付条件を新規追加
    async fn add_date_condition(&self, condition: &DateCondition) -> Result<(), RepositoryError>;

    /// 日付条件を更新
    async fn update_date_condition(&self, condition: &DateCondition) -> Result<(), RepositoryError>;

    /// 日付条件を削除
    async fn delete_date_condition(&self, id: &str) -> Result<(), RepositoryError>;
}
