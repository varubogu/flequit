use async_trait::async_trait;
use flequit_model::models::app_settings::settings::Settings;
use flequit_types::errors::repository_error::RepositoryError;

/// 設定リポジトリのトレイト
#[async_trait]
pub trait SettingsRepositoryTrait: Send + Sync {
    /// すべての設定をSettings構造体として取得します。
    async fn get_settings(&self) -> Result<Option<Settings>, RepositoryError>;
}
