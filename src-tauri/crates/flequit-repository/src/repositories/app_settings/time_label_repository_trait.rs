use async_trait::async_trait;
use flequit_model::models::app_settings::time_label::TimeLabel;
use flequit_types::errors::repository_error::RepositoryError;

/// 時刻ラベルリポジトリのトレイト
#[async_trait]
pub trait TimeLabelRepositoryTrait: Send + Sync {
    /// 指定したIDの時刻ラベルを取得します。
    async fn get_time_label(&self, id: &str) -> Result<Option<TimeLabel>, RepositoryError>;

    /// すべての時刻ラベルを取得します。
    async fn get_all_time_labels(&self) -> Result<Vec<TimeLabel>, RepositoryError>;

    /// 時刻ラベルを新規追加します。
    async fn add_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError>;

    /// 時刻ラベルを更新します。
    async fn update_time_label(&self, label: &TimeLabel) -> Result<(), RepositoryError>;

    /// 時刻ラベルを削除します。
    async fn delete_time_label(&self, id: &str) -> Result<(), RepositoryError>;
}
