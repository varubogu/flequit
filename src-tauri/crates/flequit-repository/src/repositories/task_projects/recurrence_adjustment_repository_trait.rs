use async_trait::async_trait;
use flequit_model::models::task_projects::recurrence_adjustment::RecurrenceAdjustment;
use flequit_types::errors::repository_error::RepositoryError;

/// 繰り返し調整リポジトリのトレイト
#[async_trait]
pub trait RecurrenceAdjustmentRepositoryTrait: Send + Sync {
    /// 指定したIDの繰り返し調整を取得
    async fn get_recurrence_adjustment(&self, id: &str) -> Result<Option<RecurrenceAdjustment>, RepositoryError>;

    /// すべての繰り返し調整を取得
    async fn get_all_recurrence_adjustments(&self) -> Result<Vec<RecurrenceAdjustment>, RepositoryError>;

    /// 繰り返し調整を新規追加
    async fn add_recurrence_adjustment(&self, adjustment: &RecurrenceAdjustment) -> Result<(), RepositoryError>;

    /// 繰り返し調整を更新
    async fn update_recurrence_adjustment(&self, adjustment: &RecurrenceAdjustment) -> Result<(), RepositoryError>;

    /// 繰り返し調整を削除
    async fn delete_recurrence_adjustment(&self, id: &str) -> Result<(), RepositoryError>;
}
