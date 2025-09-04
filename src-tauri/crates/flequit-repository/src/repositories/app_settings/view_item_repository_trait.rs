use async_trait::async_trait;
use flequit_model::models::app_settings::view_item::ViewItem;
use flequit_types::errors::repository_error::RepositoryError;

/// ビューアイテムリポジトリのトレイト
#[async_trait]
pub trait ViewItemRepositoryTrait: Send + Sync {
    /// 指定したIDのビューアイテムを取得します。
    async fn get_view_item(&self, id: &str) -> Result<Option<ViewItem>, RepositoryError>;

    /// すべてのビューアイテムを取得します。
    async fn get_all_view_items(&self) -> Result<Vec<ViewItem>, RepositoryError>;

    /// ビューアイテムを新規追加します。
    async fn add_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError>;

    /// ビューアイテムを更新します。
    async fn update_view_item(&self, item: &ViewItem) -> Result<(), RepositoryError>;

    /// ビューアイテムを削除します。
    async fn delete_view_item(&self, id: &str) -> Result<(), RepositoryError>;
}
