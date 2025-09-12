use async_trait::async_trait;
use flequit_model::models::task_projects::recurrence_details::RecurrenceDetails;
use flequit_types::errors::repository_error::RepositoryError;

/// 繰り返し詳細リポジトリのトレイト
#[async_trait]
pub trait RecurrenceDetailsRepositoryTrait: Send + Sync {
    /// 指定したIDの繰り返し詳細を取得
    async fn get_recurrence_details(
        &self,
        id: &str,
    ) -> Result<Option<RecurrenceDetails>, RepositoryError>;

    /// すべての繰り返し詳細を取得
    async fn get_all_recurrence_details(&self) -> Result<Vec<RecurrenceDetails>, RepositoryError>;

    /// 繰り返し詳細を新規追加
    async fn add_recurrence_details(
        &self,
        details: &RecurrenceDetails,
    ) -> Result<(), RepositoryError>;

    /// 繰り返し詳細を更新
    async fn update_recurrence_details(
        &self,
        details: &RecurrenceDetails,
    ) -> Result<(), RepositoryError>;

    /// 繰り返し詳細を削除
    async fn delete_recurrence_details(&self, id: &str) -> Result<(), RepositoryError>;
}
