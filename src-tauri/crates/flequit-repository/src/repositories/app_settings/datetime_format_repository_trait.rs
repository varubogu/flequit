use async_trait::async_trait;
use flequit_model::models::app_settings::datetime_format::DateTimeFormat;
use flequit_types::errors::repository_error::RepositoryError;

/// 日時フォーマットリポジトリのトレイト
#[async_trait]
pub trait DatetimeFormatRepositoryTrait: Send + Sync {
    /// 指定したIDの日時フォーマットを取得
    async fn get_datetime_format(&self, id: &str) -> Result<Option<DateTimeFormat>, RepositoryError>;

    /// すべての日時フォーマットを取得
    async fn get_all_datetime_formats(&self) -> Result<Vec<DateTimeFormat>, RepositoryError>;

    /// 日時フォーマットを新規追加
    async fn add_datetime_format(&self, format: &DateTimeFormat) -> Result<(), RepositoryError>;

    /// 日時フォーマットを更新
    async fn update_datetime_format(&self, format: &DateTimeFormat) -> Result<(), RepositoryError>;

    /// 日時フォーマットを削除
    async fn delete_datetime_format(&self, id: &str) -> Result<(), RepositoryError>;
}
