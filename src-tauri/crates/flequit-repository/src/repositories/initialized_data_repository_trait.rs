use async_trait::async_trait;
use flequit_model::models::initialized_data::InitializedData;
use flequit_types::errors::repository_error::RepositoryError;

/// 初期化データリポジトリのトレイト
#[async_trait]
pub trait InitializedDataRepositoryTrait: Send + Sync {
    /// 初期化データを取得
    async fn get_initialized_data(&self) -> Result<Option<InitializedData>, RepositoryError>;

    /// 初期化データを更新
    async fn update_initialized_data(&self, data: &InitializedData) -> Result<(), RepositoryError>;

    /// 初期化データを削除
    async fn delete_initialized_data(&self) -> Result<(), RepositoryError>;
}
